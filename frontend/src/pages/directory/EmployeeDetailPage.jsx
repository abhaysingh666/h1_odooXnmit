import { useParams } from 'react-router-dom';

import { ProfileScreen } from '@/components/profile/ProfileScreen';

/**
 * A card from the employee directory. Colleagues get the same layout in
 * view-only mode; HR gets the editable one. The server decides which.
 */
export default function EmployeeDetailPage() {
  const { id } = useParams();

  // Remount on navigation between two employees so the form reseeds cleanly.
  return <ProfileScreen key={id} employeeId={id} />;
}
