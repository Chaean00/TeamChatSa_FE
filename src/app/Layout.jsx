import Navbar from '../widgets/Navbar/Navbar.jsx'
import Footer from '../widgets/Footer/Footer.jsx'

function Container({ children }) {
  return (
    <div className="max-w-[1120px] mx-auto px-4">
      {children}
    </div>
  )
}

function Layout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Container>{children}</Container>
      </main>
      <Footer />
    </div>
  )
}

export default Layout

