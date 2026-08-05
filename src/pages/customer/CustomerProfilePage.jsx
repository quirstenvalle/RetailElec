import ProfileForm from '../../components/ProfileForm'

function CustomerProfilePage({ user, onSave }) {
  return (
    <ProfileForm
      user={user}
      onSave={onSave}
      backTo="/home"
      backLabel="Back to shop"
    />
  )
}

export default CustomerProfilePage
