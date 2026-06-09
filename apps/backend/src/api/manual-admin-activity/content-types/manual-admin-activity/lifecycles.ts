/**
 * Admin audit log entries are immutable: once written they may not be modified or removed.
 * Creation (via `recordAdminAudit`) is unaffected. Throwing here aborts the update/delete and
 * guards against accidental tampering through the entity service or the Strapi admin panel.
 * (Raw-knex writes bypass lifecycles; a database trigger would be required to block those —
 * see plan notes.)
 */
const IMMUTABLE_MESSAGE = "Admin audit log entries are immutable.";

export default {
  async beforeUpdate() {
    throw new Error(`${IMMUTABLE_MESSAGE} They cannot be updated.`);
  },

  async beforeDelete() {
    throw new Error(`${IMMUTABLE_MESSAGE} They cannot be deleted.`);
  },

  async beforeDeleteMany() {
    throw new Error(`${IMMUTABLE_MESSAGE} They cannot be deleted.`);
  },
};
