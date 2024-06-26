import { useEffect, useRef, useState } from "react";
import React from "react";
import { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { createContext } from "react";


type DefaultEventsMap = /*unresolved*/ any;
export interface IGameContextProps { // type des variable set
        UserStatus: string;
        setUserStatus: (userStatus: string) => void ;
        socket: React.MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap> | null> | null
        allUsers: any[]
        setAllUsers: (allUsers: []) => void ;
}

function Create() : React.MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap> | null>  {
  const socketRef = useRef<Socket | null>(null);
    useEffect(() => {
        
        
        socketRef.current  = io("http://localhost:8000", {
        })
      }, []);
      
      return (socketRef);
}

const ContextGame = createContext<IGameContextProps>({
  UserStatus: "offline",
  setUserStatus: (inRoom: string) => {},
  socket: null,
  allUsers: [],
  setAllUsers: (allUsers: any[]) => {},
});

const ContextProviderGame = ({children} : {children : React.ReactNode}) => {
  const[UserStatus, setUserStatus] = useState("offline") // ["online", "offline", "ingame"
  const[allUsers, setAllUsers] = useState([]); // all my user connected or not 
  let socket : React.MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap> | null> | null 
  socket = Create();
  return (
    <ContextGame.Provider value={{UserStatus, setUserStatus, socket, allUsers, setAllUsers}}>
      {children}
    </ContextGame.Provider>
  );
}

export { ContextGame, ContextProviderGame };

