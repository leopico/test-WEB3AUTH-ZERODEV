import WalletContext from "./components/WalletContext";

export default function Home() {
  return (
    <div className='flex flex-col justify-center items-center h-screen'>
      <WalletContext />
    </div>
  )
}