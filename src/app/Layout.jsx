import Navbar from '../widgets/Navbar/Navbar.jsx'
import Footer from '../widgets/Footer/Footer.jsx'

function Container({ children }) {
  return (
    <div className="mobile-shell px-4">
      {children}
    </div>
  )
}

function Layout({ children }) {
  return (
    <div className="min-h-dvh bg-transparent">
      <div className="mobile-shell min-h-dvh overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur">
        <Navbar />
        <main className="flex-1 pb-24 pt-3">
          <Container>{children}</Container>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default Layout
