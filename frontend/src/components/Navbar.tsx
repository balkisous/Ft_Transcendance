import Link from "next/link";
import styles from "../styles/Navbar.module.css"
import { useRouter } from "next/router";

export const Navbar = () => {
  const router = useRouter()

    return (
    <nav className={styles.navbar}>
    <div className="container flex flex-wrap items-center justify-between mx-auto text-neutral-800">
    <span className="self-center text-2xl font-semibold whitespace-nowrap text-pink-500">Ft_Transcendence</span>
    <div className="hidden w-full md:block md:w-auto" id="navbar-default">
      {router.pathname !== "/login" && <ul className="flex flex-col p-4 mt-4 border border-gray-100 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0">
        <li>
          <Link href="/profile" className={styles.link}>Home</Link>
        </li>
        <li>
          <Link href="/home_game" className={styles.link}>
            Play</Link>
        </li>
        <li>
          <Link href="/history" className={styles.link}>
            History</Link>
        </li>
        <li>
          <Link href="/Messenger2" className={styles.link}>
            Chat</Link>
        </li>
      </ul>}
    </div>
  </div>
</nav>
    );
}