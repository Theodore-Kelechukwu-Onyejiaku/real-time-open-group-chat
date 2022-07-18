import { useState, useRef, useEffect } from "react"
import { io } from "socket.io-client";
import "./App.css"

function App() {
  const toastRef = useRef(null)

  const [activeUsers, setActiveUsers] = useState(0)
  const [socket, setSocket] = useState(null)
  const [id, setId] = useState("")
  const [socketid, setSocketId] = useState("")
  const [username, setUsername] = useState("")
  const [chat, setChat] = useState("")
  const [allChats, setAllChats] = useState([]);
  const [notification, setNotification] = useState("");
  const [someoneTyping, setSomeoneTyping] = useState("");

  const scrollToBottom = () => {
    window.scroll({
      top: document.body.offsetHeight, left: 0, behavior: 'smooth'
    });
  };

  const showToast = (bgColor) => {
    toastRef.current.className = "show"
    toastRef.current.style.backgroundColor = bgColor
    setTimeout(() => {
      toastRef.current.className = toastRef.current.className.replace("show", "")
    }, 3000)
  }

  const changeUsername = () => {
    if (!username) return
    setId(username)
    setAllChats(prev => {
      return prev.map(
        obj => obj.socketid === socketid ? { ...obj, id: username } : obj)
    })
    socket.emit("usernameChange", username, socketid)
  }

  const handleChatInput = (e) => {
    setChat(e.target.value)
  }

  const submitChat = () => {
    if (socket.disconnected) {
      setNotification("You are disconnected. Refresh page to continue")
      showToast("orange")
      return
    }
    if (!chat) return
    socket.emit("chat", id, chat, socketid)
    setChat("")
    scrollToBottom()
  }

  const logOut = () => {
    if (socket.disconnected) {
      setNotification("You are already disconnected!")
      showToast("orange")
    } else {
      socket.disconnect()
      setNotification("Logout Successful!\n Refresh page to reconnect")
      showToast("green")
    }
  }

  const getTime = () => {
    let time = new Date(); let hour = time.getHours(); let minutes = time.getMinutes();
    let meridiem = `${time.getHours() > 12 ? "PM" : "AM"}`;
    return `${hour}:${minutes} ${meridiem}`
  }

  const searchUser = (socketid) => {
    for (var i = 0; i < allChats.length; i++) {
      if (allChats[i].socketid === socketid) {
        return allChats[i];
      }
    }
  }

  const handleUserTyping = (e) => {
    clearTimeout(timeout);
    socket.emit("userTyping", socketid, "start")
    var timeout = setTimeout(function () { socket.emit("userTyping", socketid, "stop") }, 1000)
  }

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_ENDPOINT);
    setSocket(newSocket);

    newSocket.on('connect_error', function () {
      alert("Sorry, there seems to be an issue with the connection! Try refreshing");
    })

    newSocket.emit("activeUsers")
    newSocket.on("getId", (id) => {
      setId(id)
      setSocketId(id)
    })

    newSocket.on("countUsers", (onlineUsers) => {
      setActiveUsers(onlineUsers)
    })

    newSocket.on("sendChat", (id, chat, socketid) => {
      setAllChats(prevArr => [...prevArr, { chat, id, socketid, time: getTime() }])
      scrollToBottom()
    })

    newSocket.on("resetChat", (username, usersocketid) => {
      setAllChats(prev => {
        return prev.map(
          obj => obj.socketid === usersocketid ? { ...obj, id: username } : obj)
      })
    })

    newSocket.on("message", (message) => {
      setNotification(message)
      showToast("green")
    })

    // clean up
    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    socket?.emit("activeUsers")
    socket?.on("notification", (socketid) => {
      let disconnectedUser = searchUser(socketid);
      if (!disconnectedUser || allChats.length === 0) return
      setNotification(disconnectedUser.id + " is disconnected!")
      showToast("#900")
    })

    socket?.on("someoneTyping", (socketid, type) => {
      if (type === "stop") {
        setSomeoneTyping("")
      } else {
        const user = searchUser(socketid)
        setSomeoneTyping(user?.id)
      }
    })
  }, [allChats])

  return (
    <>
      <div className="fixed p-3 w-full text-center bg-white"><span>Total connected devices:<span className="text-center ml-1 text-base text-green-600">{activeUsers}</span></span><button onClick={logOut} className="ml-5 p-3 shadow-lg text-red-500 rounded bg-gray-100">Logout</button>
        <div>
          <h4 className="text-center">Username:<span className="text-green-600 font-extrabold rounded-full">{id} </span></h4>
        </div>
        <div className="transition-all duration-1000 text-center">
          <label className="block text-gray-700">Change your Username:</label>
          <div className="flex flex-row items-center justify-center">
            <input type="text" onChange={(e) => { setUsername(e.target.value) }} value={username} className="border rounded p-2 focus:outline-green-500 text-gray-400" placeholder={`${id}`}></input>
            <button onClick={changeUsername} className="p-3 shadow-lg bg-gray-100 rounded  ml-3 text-green-500">Change</button>
          </div>
        </div>
      </div>
      <div className="">
        <p id="toast" ref={toastRef}>{notification}</p>
        <div className="p-4 md:mx-20 lg:mx-40 mb-40">
          <div className="chat-box mt-40">
            {allChats.map((chat, index) => (
              <div key={index} className={`${chat.id === id ? "mr-0 ml-auto right" : "left"}  my-3 w-fit shadow-lg p-4 rounded-lg`}>
                <span className={`${chat.id === id ? "  text-green-500" : "text-orange-500"} rounded font-extrabold`}>{chat.id}</span>
                <p className="md:text-base">{chat.chat}</p>
                <span className="text-sm text-gray-400">{chat.time}</span>
              </div>
            ))}
          </div>

        </div>
        <div className="fixed z-50 w-full bottom-0 bg-white p-2">
          {someoneTyping && <p className="text-center">{someoneTyping} is typing...</p>}
          <form className="flex flex-row justify-center md:w-1/2 md:m-auto" onSubmit={(e) => { e.preventDefault(); submitChat(chat) }}>
            <input value={chat} onKeyUp={() => { setSomeoneTyping(null) }} onKeyDown={handleUserTyping} onChange={(e) => { handleChatInput(e) }} onKeyPress={(e) => { e.key === "Enter" && handleChatInput(e) }} className="border md:w-3/4 p-4 focus:outline-green-500" placeholder="Type in your message" />
            <button className="p-3 shadow-lg bg-gray-100 rounded text-green-500" type="submit">Send</button>
          </form>
          <p className="text-center">Made with Love by <a href="https://www.linkedin.com/in/theodore20151014166/" className="underline">Theodore</a></p>
        </div>
      </div>
    </>
  );
}

export default App;