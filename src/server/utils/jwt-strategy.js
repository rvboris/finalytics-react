import { Strategy } from 'passport-jwt';

Strategy.prototype.authenticate = function authenticate(req) {
  this._jwtFromRequest(req).then((token) => {
    if (!token) {
      this.fail(new Error('No auth token'));
      return;
    }

    this._secretOrKeyProvider(req, token, (secretOrKeyError, secretOrKey) => {
      if (secretOrKeyError) {
        this.fail(secretOrKeyError);
      }

      Strategy.JwtVerifier(token, secretOrKey, this._verifOpts, (jwtErr, payload) => {
        if (jwtErr) {
          this.fail(jwtErr);
          return;
        }

        const verified = (err, user, info) => {
          if (err) {
            return this.error(err);
          } else if (!user) {
            return this.fail(info);
          }
          return this.success(user, info);
        };

        try {
          if (this._passReqToCallback) {
            this._verify(req, payload, verified);
            return;
          }

          this._verify(payload, verified);
        } catch (ex) {
          this.error(ex);
        }
      });
    });
  });
};

export default Strategy;
