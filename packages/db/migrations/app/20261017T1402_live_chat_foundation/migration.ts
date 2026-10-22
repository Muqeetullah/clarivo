#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/832cf6e41ba4f413567e94b8693be79f919375e8b7d3fac02cd2a5dd10c7640f/contract';
import endContract from '../../snapshots/832cf6e41ba4f413567e94b8693be79f919375e8b7d3fac02cd2a5dd10c7640f/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'clarivo' }),
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'clarivo',
        table: 'avatar_uploads',
        columns: [
          col('confirmedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('expiresAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('mime', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('size', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('workspaceId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'avatar_upload_mime_2966695d',
            "mime IN ('image/png', 'image/jpeg', 'image/webp', 'image/gif')",
          ),
          checkExpression('avatar_upload_size_12729bc4', 'size > 0 AND size <= 2097152'),
        ],
      }),
      this.createTable({
        schema: 'clarivo',
        table: 'conversations',
        columns: [
          col('closedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('handoffReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lastMessageAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('state', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('version', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('visitorId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('workspaceId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'conversation_closed_timestamp_23fdbb3f',
            `(state = 'closed') = ("closedAt" IS NOT NULL)`,
          ),
          checkExpression(
            'conversation_handoff_reason_8f0dc0d4',
            `"handoffReason" IS NULL OR "handoffReason" IN ('low_confidence', 'no_relevant_knowledge', 'visitor_requested', 'agent_off')`,
          ),
          checkExpression(
            'conversation_state_52f142c4',
            "state IN ('ai', 'waiting', 'human', 'closed')",
          ),
          checkExpression('conversation_version_ec05e13a', 'version >= 0'),
        ],
      }),
      this.createTable({
        schema: 'clarivo',
        table: 'members',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('workspaceId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('member_owner_only_56ac498f', "role = 'owner'"),
        ],
      }),
      this.createTable({
        schema: 'clarivo',
        table: 'messages',
        columns: [
          col('author', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('body', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('clientMessageId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('conversationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('memberId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('workspaceId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'message_author_5961db72',
            "author IN ('visitor', 'agent', 'member', 'system')",
          ),
          checkExpression('message_body_length_d02407bd', 'char_length(body) BETWEEN 1 AND 4000'),
          checkExpression(
            'message_member_author_09a2d8f9',
            `(author = 'member') = ("memberId" IS NOT NULL)`,
          ),
        ],
      }),
      this.createTable({
        schema: 'clarivo',
        table: 'visitor_visits',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('visitId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('visitorId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('workspaceId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'clarivo',
        table: 'visitors',
        columns: [
          col('browser', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('country', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('device', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('firstSeenAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('language', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lastSeenAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('os', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('page', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('referrer', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('secretHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('timeZone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('visitCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('workspaceId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('visitor_visit_count_bdab665b', '"visitCount" >= 1'),
        ],
      }),
      this.createTable({
        schema: 'clarivo',
        table: 'workspaces',
        columns: [
          col('accentColor', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('agentName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('allowedDomains', 'text[]', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('avatarKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('greeting', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('installedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('position', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('settingsVersion', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('workspace_position_65a6608a', "position IN ('left', 'right')"),
          checkExpression('workspace_version_f3ba4a31', '"settingsVersion" >= 0'),
          checkExpression(
            'workspaces_allowedDomains_elem_not_null_156d14ed',
            'array_position("allowedDomains", NULL) IS NULL',
          ),
        ],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'avatar_uploads',
        constraint: 'avatar_uploads_key_key',
        columns: ['key'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'conversations',
        constraint: 'conversations_workspaceId_id_key',
        columns: ['workspaceId', 'id'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'members',
        constraint: 'members_workspaceId_key',
        columns: ['workspaceId'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'members',
        constraint: 'members_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'members',
        constraint: 'members_workspaceId_id_key',
        columns: ['workspaceId', 'id'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'messages',
        constraint: 'messages_workspaceId_clientMessageId_key',
        columns: ['workspaceId', 'clientMessageId'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'visitor_visits',
        constraint: 'visitor_visits_workspaceId_visitorId_visitId_key',
        columns: ['workspaceId', 'visitorId', 'visitId'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'visitors',
        constraint: 'visitors_workspaceId_id_key',
        columns: ['workspaceId', 'id'],
      }),
      this.addUnique({
        schema: 'clarivo',
        table: 'workspaces',
        constraint: 'workspaces_ownerId_key',
        columns: ['ownerId'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'avatar_uploads',
        index: 'avatar_uploads_workspaceId_idx_ba65f874',
        columns: ['workspaceId'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'conversations',
        index: 'conversations_workspaceId_lastMessageAt_idx_db1aff40',
        columns: ['workspaceId', 'lastMessageAt'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'conversations',
        index: 'conversations_workspaceId_visitorId_idx_d74d200a',
        columns: ['workspaceId', 'visitorId'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'conversations',
        index: 'one_open_conversation_per_visitor_cff00125',
        columns: ['workspaceId', 'visitorId'],
        extras: { where: "state <> 'closed'", unique: true },
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'conversations',
        index: 'open_conversation_activity_f4d69313',
        columns: ['lastMessageAt'],
        extras: { where: "state <> 'closed'" },
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'messages',
        index: 'messages_workspaceId_conversationId_createdAt_id_idx_8939fffd',
        columns: ['workspaceId', 'conversationId', 'createdAt', 'id'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'messages',
        index: 'messages_workspaceId_conversationId_idx_97f9ba37',
        columns: ['workspaceId', 'conversationId'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'messages',
        index: 'messages_workspaceId_memberId_idx_1f4f03c4',
        columns: ['workspaceId', 'memberId'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'visitor_visits',
        index: 'visitor_visits_workspaceId_visitorId_idx_d74d200a',
        columns: ['workspaceId', 'visitorId'],
      }),
      this.createIndex({
        schema: 'clarivo',
        table: 'visitors',
        index: 'visitors_workspaceId_idx_ba65f874',
        columns: ['workspaceId'],
      }),
      this.addForeignKey({
        schema: 'clarivo',
        table: 'avatar_uploads',
        foreignKey: {
          name: 'avatar_uploads_workspaceId_fkey',
          columns: ['workspaceId'],
          references: { schema: 'clarivo', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'clarivo',
        table: 'conversations',
        foreignKey: {
          name: 'conversations_workspaceId_visitorId_fkey',
          columns: ['workspaceId', 'visitorId'],
          references: { schema: 'clarivo', table: 'visitors', columns: ['workspaceId', 'id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'clarivo',
        table: 'members',
        foreignKey: {
          name: 'members_workspaceId_fkey',
          columns: ['workspaceId'],
          references: { schema: 'clarivo', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'clarivo',
        table: 'messages',
        foreignKey: {
          name: 'messages_workspaceId_conversationId_fkey',
          columns: ['workspaceId', 'conversationId'],
          references: { schema: 'clarivo', table: 'conversations', columns: ['workspaceId', 'id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'clarivo',
        table: 'messages',
        foreignKey: {
          name: 'messages_workspaceId_memberId_fkey',
          columns: ['workspaceId', 'memberId'],
          references: { schema: 'clarivo', table: 'members', columns: ['workspaceId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'clarivo',
        table: 'visitor_visits',
        foreignKey: {
          name: 'visitor_visits_workspaceId_visitorId_fkey',
          columns: ['workspaceId', 'visitorId'],
          references: { schema: 'clarivo', table: 'visitors', columns: ['workspaceId', 'id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'clarivo',
        table: 'visitors',
        foreignKey: {
          name: 'visitors_workspaceId_fkey',
          columns: ['workspaceId'],
          references: { schema: 'clarivo', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
