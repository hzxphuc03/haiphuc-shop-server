import { PayOS } from '@payos/node';
import { config } from '../config/index.js';

console.log('Initializing PayOS with Client ID:', config.payment.payos.clientId ? 'OK' : 'MISSING');

if (!config.payment.payos.clientId || !config.payment.payos.apiKey || !config.payment.payos.checksumKey) {
  console.error('CRITICAL: PayOS credentials are missing in .env!');
}

const payos = new PayOS({
  clientId: config.payment.payos.clientId || 'dummy',
  apiKey: config.payment.payos.apiKey || 'dummy',
  checksumKey: config.payment.payos.checksumKey || 'dummy'
});

export default payos;
