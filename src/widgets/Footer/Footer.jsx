function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-12">
      <div className="max-w-[1120px] mx-auto px-4 py-8 text-[12px] text-mute">
        © {new Date().getFullYear()} TeamMatch
      </div>
    </footer>
  )
}

export default Footer

