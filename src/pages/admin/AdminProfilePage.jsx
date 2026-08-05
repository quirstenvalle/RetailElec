import ProfileForm from '../../components/ProfileForm'

function AdminProfilePage({ user, onSave }) {
  return (
    <ProfileForm
      user={user}
      onSave={onSave}
      backTo="/admin/dashboard"
      backLabel="Back to dashboard"
    />
  )
}

export default AdminProfilePage
