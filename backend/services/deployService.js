const dnsService = require('./dnsService');
const Subdomain = require('../models/Subdomain');
const logger = require('../utils/logger');
const { exec } = require('child_process');

class DeployService {
    constructor() {
        this.deploymentQueue = [];
        this.isProcessing = false;
    }

    async provisionResources(subdomainId) {
        try {
            const subdomain = await Subdomain.findById(subdomainId);
            if (!subdomain) {
                throw new Error(`Subdomain ${subdomainId} not found`);
            }

            // Add to queue
            this.deploymentQueue.push(subdomainId);
            logger.info(`Added subdomain ${subdomainId} to deployment queue`);

            // Process queue if not already processing
            if (!this.isProcessing) {
                this._processQueue();
            }

            return { queued: true, position: this.deploymentQueue.length };
        } catch (err) {
            await dnsService.updateSubdomainStatus(subdomainId, 'failed');
            logger.error(`Provisioning failed: ${err.message}`);
            throw err;
        }
    }

    async _processQueue() {
        if (this.deploymentQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const subdomainId = this.deploymentQueue.shift();
        
        try {
            const subdomain = await Subdomain.findById(subdomainId);
            logger.info(`Processing deployment for ${subdomain.name}`);

            // Update status to deploying
            await dnsService.updateSubdomainStatus(subdomainId, 'deploying');

            // 1. Create DNS record
            await dnsService.createSubdomainRecord(subdomain.name);
            
            // 2. Create hosting space (example with CLI - replace with your actual commands)
            await this._executeCommand(`mkdir -p /var/www/${subdomain.name}`);
            
            // 3. Deploy default content
            await this._executeCommand(`cp -r /var/www/template/* /var/www/${subdomain.name}/`);
            
            // 4. Configure web server (example for Nginx)
            await this._setupNginxConfig(subdomain.name);
            
            // 5. Restart web server
            await this._executeCommand('systemctl reload nginx');

            // Update status to active
            await dnsService.updateSubdomainStatus(subdomainId, 'active');
            logger.info(`Successfully deployed ${subdomain.name}`);

        } catch (err) {
            logger.error(`Deployment failed for ${subdomainId}: ${err.message}`);
            await dnsService.updateSubdomainStatus(subdomainId, 'failed');
            
            // Attempt cleanup
            try {
                await dnsService.deleteSubdomainRecord(subdomain.name);
                await this._executeCommand(`rm -rf /var/www/${subdomain.name}`);
            } catch (cleanupErr) {
                logger.error(`Cleanup failed: ${cleanupErr.message}`);
            }
        } finally {
            // Process next item in queue
            setImmediate(() => this._processQueue());
        }
    }

    async _setupNginxConfig(subdomain) {
        const config = `
server {
    listen 80;
    server_name ${subdomain}.${process.env.BASE_DOMAIN};
    root /var/www/${subdomain};
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
        `;
        
        await this._executeCommand(`echo '${config}' > /etc/nginx/sites-available/${subdomain}.conf`);
        await this._executeCommand(`ln -sf /etc/nginx/sites-available/${subdomain}.conf /etc/nginx/sites-enabled/`);
    }

    _executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Command failed: ${command}`, { error, stderr });
                    return reject(error);
                }
                logger.debug(`Command executed: ${command}`, { stdout });
                resolve(stdout);
            });
        });
    }
}

module.exports = new DeployService();