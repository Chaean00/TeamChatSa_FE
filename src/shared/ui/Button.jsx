function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Button({ variant = 'primary', className, ...props }) {
  const base = 'inline-flex min-w-0 items-center justify-center rounded-xl px-4 py-2 text-center text-sm leading-tight font-medium whitespace-normal break-keep transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-card',
    ghost: 'bg-white hover:bg-gray-50 text-ink border border-gray-200',
  }
  return <button className={cx(base, styles[variant], className)} {...props} />
}

export default Button
