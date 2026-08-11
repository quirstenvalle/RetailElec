import ProfileForm from '../../components/ProfileForm'

function AdminProfilePage({ user, onSave, onLogout }) {
  return (
    <ProfileForm
      user={user}
      onSave={onSave}
      onLogout={onLogout}
      backTo="/admin/dashboard"
      backLabel="Back to dashboard"
    />
  )
}

export default AdminProfilePage
