function AuthSplitLayout({
  image,
  imageOn = 'left',
  bordered = false,
  logo,
  brandName,
  title,
  subtitle,
  children,
}) {
  const media = (
    <div className="auth-media" aria-hidden="true">
      <img src={image} alt="" />
    </div>
  )

  return (
    <section className={`auth-page ${imageOn === 'right' ? 'login' : 'register'}`}>
      {imageOn === 'left' ? media : null}
      <div className="auth-form-panel">
        {logo ? (
          <div className="auth-brand-corner">
            <img className="auth-brand-mark" src={logo} alt={brandName || 'Store logo'} />
          </div>
        ) : null}
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
