import { app } from './app.js';
import { sweepExpiredOffers } from './dispatch.js';
import { config } from './config.js';

app.listen(config.port, () => console.log(`Dhandha API listening on :${config.port}`));
setInterval(() => { try { sweepExpiredOffers(); } catch (e) { console.error('offer sweep failed', e); } }, 60_000).unref();
