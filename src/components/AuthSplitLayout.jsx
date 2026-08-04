function AuthSplitLayout({ image, imageOn = 'left', bordered = false, title, subtitle, children }) {
  const media = (
    <div className="auth-media" aria-hidden="true">
      <img src={image} alt="" />
    </div>
  )

  return (
    <section className={`auth-page ${imageOn === 'right' ? 'login' : 'register'}`}>
      {imageOn === 'left' ? media : null}
      <div className="auth-form-panel">
        <div className={`auth-card${bordered ? ' bordered' : ''}`}>
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </div>
      {imageOn === 'right' ? media : null}
    </section>
  )
}

export default AuthSplitLayout
