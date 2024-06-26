import {useEffect, useState} from "react"
import gameService from "@/services/game-service"
import styles from "@/styles/History.module.css"
import Link from "next/link"
import userService from "@/services/user-service"
import { useRouter } from "next/router"
import authenticationService from "@/services/authentication-service"

export default function UserHistory () {
    return (
        <>
        <UserGames />
        </>
    )
}

export const UserGames = () => {
    const [user, setUser] = useState({username: "", id: "", email: "", wins: 0, losses: 0, is2fa: false, avatar: ""})
    const [games, setGames] = useState([])
    const router = useRouter();

    useEffect(() => {
        const fetchProfileAndGames = async () => {
          const result = await userService.profile();
          setUser({ ...result });
          if (result.username && result.id) {
            const res = await gameService.get_games_by_username(result.username);
            if (res) {
              setGames(res);
            //   console.log(res);
            }
          }
        };
      
        let isMounted = true; // New state variable
      
        fetchProfileAndGames();
      
        return () => {
          isMounted = false; // Cleanup function to handle component unmounting
        };
      }, []);

// console.log("user in userhistory", user)
// console.log("games in userhistory", games)
    return (
        <>
        <div className={styles.container}>
        <h1 className={styles.h1}>{user.username}&apos;s match history</h1>
        <table className={styles.table}>
        <thead>
            <tr>
                <th>WINNER</th>
                <th>Player A</th>
                <th>Player B</th>
                <th>Score A</th>
                <th>Score B</th>
            </tr>
        </thead>
        {games.map((current:any) => {
            const { player1, player2, score1, score2 } = current;
            return (
        <tbody key={current.id}>
            <tr>
                <td className={styles.bold2}>👑 <br></br>{score1 < score2 ? player2?.username : player1.username}</td>
                <td className={styles.bold}>
                    <div className={styles.avatarContainer}>
                        {player1.avatar && <picture><img src={`${player1.avatar}`} alt="avatar user" className={styles.profilepicture}/></picture>}
                        {!player1.avatar && <picture><img src="/default.png" alt="avatar user" className={styles.profilepicture}></img></picture>}
                        <Link href={`/public?username=${player1?.id}`}>
                            {player1.username}
                        </Link>
                    </div>
                </td>
                <td className={styles.bold}>
                    <div className={styles.avatarContainer}>
                        {player2.avatar && <picture><img src={`${player2.avatar}`} alt="avatar user" className={styles.profilepicture}/></picture>}
                        {!player2.avatar && <picture><img src="/default.png" alt="avatar user" className={styles.profilepicture}></img></picture>}
                        <Link href={`/public?username=${player2.id}`}>
                            {player2.username}
                        </Link>
                    </div>
                </td>
                <td className={styles.number}>{score1} {score1 < score2 ? "🔴" : "🟢" }</td>
                <td className={styles.number}>{score2}  {score1 < score2 ? "🟢" : "🔴" }</td>
            </tr>
        </tbody>
            )
        })}
    </table>
    </div>
    </>
    )
}