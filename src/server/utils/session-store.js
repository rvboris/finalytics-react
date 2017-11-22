import mongoose from 'mongoose';

export default class SessionStore {
  constructor(opts) {
    const options = Object.assign({}, opts);
    options.collection = options.collection || 'sessions';
    options.connection = options.connection || mongoose;
    options.expires = options.expires || 60 * 60 * 24 * 14; // 2 weeks
    options.model = options.model || 'SessionStore';

    const Schema = options.connection.Schema || mongoose.Schema;
    const SessionSchema = new Schema({
      sid: {
        index: true,
        type: String,
      },
      blob: String,
      updatedAt: {
        default: new Date(),
        expires: options.expires,
        type: Date,
      },
    });

    this.Session = options.connection.model(options.model, SessionSchema, options.collection);
  }


  async destroy(sid) {
    return this.Session.remove({ sid });
  }


  async get(sid, parse) {
    const data = await this.Session.findOne({ sid });

    if (!data || !data.sid) {
      return null;
    }

    if (parse === false) {
      return data.blob;
    }

    return JSON.parse(data.blob);
  }


  async load(sid) {
    return this.get(sid, false);
  }


  async remove(sid) {
    return this.destroy(sid);
  }


  async save(sid, blob) {
    return this.set(sid, blob);
  }


  async set(sid, blob) {
    const data = {
      sid,
      blob: typeof blob === 'object' ? JSON.stringify(blob) : blob,
      updatedAt: new Date(),
    };

    await this.Session.findOneAndUpdate({ sid }, data, { upsert: true, safe: true });
  }


  static create(options) {
    return new SessionStore(options);
  }
}
