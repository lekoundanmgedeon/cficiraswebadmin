/**
 * @deprecated Déplacé vers `@/shared/stores/notificationStore`.
 *
 * Alias de compatibilité : les stores non encore migrés importent
 * `useMessageStore` depuis ce chemin. Il pointe désormais sur le store unique de
 * notifications, dont l'interface publique est identique (`notifySuccess`,
 * `notifyError`, `notifyInfo`, `notifyWarning`, `clearMessages`).
 *
 * À supprimer une fois tous les modules migrés — voir docs/ARCHITECTURE.md.
 */
export { useNotificationStore as useMessageStore } from '@/shared/stores/notificationStore';
