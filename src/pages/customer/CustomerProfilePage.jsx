import ProfileForm from '../../components/ProfileForm'

function CustomerProfilePage({ user, onSave, onLogout }) {
  return (
    <ProfileForm
      user={user}
      onSave={onSave}
      onLogout={onLogout}
      backTo="/home"
      backLabel="Back to shop"
    />
  )
}

export default CustomerProfilePage
