import React, {
  useState, useRef, useEffect,
} from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  // set up toast as ref
  const toastRef = useRef(null);

  // create states
  const [activeUsers, setActiveUsers] = useState(0);
  const [socket, setSocket] = useState(null);
  const [id, setId] = useState('');
  const [socketid, setSocketId] = useState('');
  const [username, setUsername] = useState('');
  const [chat, setChat] = useState('');
  const [allChats, setAllChats] = useState([]);
  const [notification, setNotification] = useState('');
  const [someoneTyping, setSomeoneTyping] = useState('');

  // scroll to bottom page function when message is sent
  const scrollToBottom = () => {
    window.scroll({
      top: document.body.offsetHeight, left: 0, behavior: 'smooth',
    });
  };

  // function to show toast
  const showToast = (bgColor) => {
    toastRef.current.className = 'show';
    toastRef.current.style.backgroundColor = bgColor;
    setTimeout(() => {
      toastRef.current.className = toastRef.current.className.replace('show', '');
    }, 3000);
  };

  // function to change username
  const changeUsername = () => {
    if (!username) return;
    setId(username);
    setAllChats((prev) => prev.map(
      (obj) => (obj.socketid === socketid ? { ...obj, id: username } : obj),
    ));
    socket.emit('usernameChange', username, socketid);
  };

  // function handle chat message input
  const handleChatInput = (e) => {
    setChat(e.target.value);
  };

  // function to submit chat
  const submitChat = () => {
    if (socket.disconnected) {
      setNotification('You are disconnected. Refresh page to continue');
      showToast('orange');
      return;
    }
    if (!chat) return;
    socket.emit('chat', id, chat, socketid);
    setChat('');
    scrollToBottom();
  };

  // function to disconnect socket
  const logOut = () => {
    if (socket.disconnected) {
      setNotification('You are already disconnected!');
      showToast('orange');
    } else {
      socket.disconnect();
      setNotification('Logout Successful!\n Refresh page to reconnect');
      showToast('green');
    }
  };

  // function to get time when message or chat was sent
  const getTime = () => {
    const time = new Date(); const hour = time.getHours(); const minutes = time.getMinutes();
    const meridiem = `${time.getHours() > 12 ? 'PM' : 'AM'}`;
    return `${hour}:${minutes} ${meridiem}`;
  };

  // function to search user
  const searchUser = (userId) => {
    let user = {};
    for (let i = 0; i < allChats.length; i += 1) {
      if (allChats[i].socketid === userId) {
        user = allChats[i];
      }
    }
    return user;
  };

  // function to handle when a user or socket is typing
  const handleUserTyping = () => {
    clearTimeout(timeout);
    socket.emit('userTyping', socketid, 'start');
    var timeout = setTimeout(() => { socket.emit('userTyping', socketid, 'stop'); }, 1000);
  };

  /*
      First useEffect: runs only once and
      attaches the events below to a connected socket instance
    */
  useEffect(() => {
    // connect with server
    const newSocket = io(process.env.REACT_APP_SERVER_ENDPOINT);
    setSocket(newSocket);

    // if connection error
    newSocket.on('connect_error', () => {
      alert('Sorry, there seems to be an issue with the connection! Try refreshing');
      setNotification('Logout Successful!\n Refresh page to reconnect');
      showToast('green');
    });

    // get all users or sockets connected
    newSocket.emit('activeUsers');

    // gets socket id of a socket or user
    newSocket.on('getId', (idOfSocket) => {
      setId(idOfSocket);
      setSocketId(idOfSocket);
    });

    // gets the number of connects
    newSocket.on('countUsers', (onlineUsers) => {
      setActiveUsers(onlineUsers);
    });

    // adds a message to the list of messages or chats
    // and scrolls to bottom of page
    newSocket.on('sendChat', (userId, userChat, idOfSocket) => {
      setAllChats((prevArr) => [...prevArr, {
        chat: userChat, id: userId, socketid: idOfSocket, time: getTime(),
      }]);
      scrollToBottom();
    });

    // restet all chat when a username is changed
    newSocket.on('resetChat', (nameofUser, usersocketid) => {
      setAllChats((prev) => prev.map(
        (obj) => (obj.socketid === usersocketid ? { ...obj, id: nameofUser } : obj),
      ));
    });

    // triggers when there is a notification
    newSocket.on('message', (message) => {
      setNotification(message);
      showToast('green');
    });

    // clean up to close instance to avoid side effects
    return () => {
      newSocket.close();
    };
  }, []);

  /*
     Second useEffect: runs when there is a new chat or message
    */
  useEffect(() => {
    // gets connected users
    socket?.emit('activeUsers');

    // a notification for disconnection
    socket?.on('disconnectNotification', (idOfSocket) => {
      const disconnectedUser = searchUser(idOfSocket);
      if (!disconnectedUser || allChats.length === 0) return;
      setNotification(`${disconnectedUser.id} is disconnected!`);
      showToast('#900');
    });

    // event for when a socket or user is typing
    socket?.on('someoneTyping', (idOfSocket, type) => {
      if (type === 'stop') {
        setSomeoneTyping('');
      } else {
        const user = searchUser(idOfSocket);
        setSomeoneTyping(user?.id);
      }
    });
  }, [allChats]);

  return (
    <>
      {/* HEADER */}
      <div className="fixed p-3 w-full text-center bg-white">
        <span>
          Total connected devices:
          <span className="text-center ml-1 text-base text-green-600">{activeUsers}</span>
        </span>
        <button type="button" onClick={logOut} className="ml-5 p-3 shadow-lg text-red-500 rounded bg-gray-100">Logout</button>
        <div>
          <h4 className="text-center">
            Username:
            <span className="text-green-600 font-extrabold rounded-full">
              {id}
              {' '}
            </span>
          </h4>
        </div>
        <div className="transition-all duration-1000 text-center">
          <label className="block text-gray-700">Change your Username:</label>
          <div className="flex flex-row items-center justify-center">
            <input type="text" onChange={(e) => { setUsername(e.target.value); }} value={username} className="border rounded p-2 focus:outline-green-500 text-gray-400" placeholder={`${id}`} />
            <button type="button" onClick={changeUsername} className="p-3 shadow-lg bg-gray-100 rounded  ml-3 text-green-500">Change</button>
          </div>
        </div>
      </div>
      <div className="">

        {/* TOAST NOTIFICATION */}
        <p id="toast" ref={toastRef}>{notification}</p>

        {/* MESSAGES OR CHATS */}
        <div className="p-12 md:mx-20 lg:mx-40 mb-40">
          <div className="chat-box mt-40">
            {allChats.map((userChat, i) => (
              <div key={i} className={`${userChat.id === id ? 'mr-0 ml-auto right' : 'left'}  my-3 w-fit shadow-lg p-4 rounded-lg`}>
                <span className={`${userChat.id === id ? '  text-green-500' : 'text-orange-500'} rounded font-extrabold`}>{userChat.id}</span>
                <p className="md:text-base">{userChat.chat}</p>
                <span className="text-sm text-gray-400">{userChat.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KEYBOARD AREA */}
        <div className="fixed z-50 w-full bottom-0 bg-white p-2">
          {someoneTyping && (
            <p className="text-center">
              {someoneTyping}
              {' '}
              is typing...
            </p>
          )}
          <form className="flex flex-row justify-center md:w-1/2 md:m-auto" onSubmit={(e) => { e.preventDefault(); submitChat(chat); }}>
            <input value={chat} onKeyUp={() => { setSomeoneTyping(null); }} onKeyDown={handleUserTyping} onChange={(e) => { handleChatInput(e); }} onKeyPress={(e) => { if (e.key === 'Enter') handleChatInput(e); }} className="border md:w-3/4 p-4 focus:outline-green-500" placeholder="Type in your message" />
            <button className="p-3 shadow-lg bg-gray-100 rounded text-green-500" type="submit">Send</button>
          </form>
          <p className="text-center">
            Made with
            <span className="text-red-400">&#9829;</span>
            {' '}
            by
            <a href="https://www.linkedin.com/in/theodore20151014166/" className="underline">Theodore</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default App;
