import { ProfileScreen } from '@/components/profile/ProfileScreen';

/**
 * "My Profile" from the avatar menu — the wireframe's form view, where the
 * employee can edit the fields HR has left open to them.
 */
export default function MyProfile() {
  return <ProfileScreen isSelf />;
}
