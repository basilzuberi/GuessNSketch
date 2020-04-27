const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const {Users} = require('./functions/users');
const {Words} = require('./functions/words');
const {generateMessage} = require('./functions/message');
const {TimeLimit} = require('./functions/time');
const {Img} = require('./functions/img'); 

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);
app.use(express.static(publicPath));

let users = new Users();
let words = new Words();

let countDown;
let latestImage;

let word = words.getRandomWord();

io.on('connection', (socket)=>{
    
    socket.on('joinGame', (userName)=>{

        if(!users.users.length){
            users.addUser(socket.id, userName, true);
            socket.join('draw');
            socket.emit("drawer", word.name);
            countDown = new TimeLimit((time)=>{
                if(time === 0){
                  io.in('draw').emit('stopCanvas');
                  let newDrawer = switchPlayers();
                  io.emit('serverMessage', generateMessage(`Nobody`, ` guessed the word. Word was: '${word.name}'. ${newDrawer.name} is the new drawer`));
                  
                  chooseWord();
                }
                io.emit('countDown', time);
              });
              countDown.startCountDown();

        }else{
            users.addUser(socket.id, userName, false);
            socket.join('guess');
            socket.emit('clearCanvas');
            socket.emit('drawing', latestImage);
            socket.emit('guess', word.category);
        }

        socket.emit('serverMessage', generateMessage('Welcome...', ` ${userName}`));
        socket.broadcast.emit('serverMessage', generateMessage(`${userName} `, `has joined a game`));
        io.emit('scoreBoard', users.users);

    });

    socket.on('message', (msg)=>{

        let user = users.getUser(socket.id);
        if(word.name.toLowerCase() === msg.toLowerCase()){
            io.in('draw').emit('stopCanvas');
            let drawer = users.getDrawer();
            users.addScore(socket.id);
            users.addScore(drawer.id);
            io.emit('chatWindow', generateMessage(user.name, msg));
            io.emit('serverMessage', generateMessage(`${user.name} `, `has guessed the word : ${word.name}`));
            switchPlayers(user);
            chooseWord();
            countDown.resetTime();
        }else{
            io.emit('chatWindow', generateMessage(user.name, msg));

        }

    }); 
    socket.on('drawing', (pic)=>{
        if(!img.start)
            img.startInterval();

        img.addPic(pic);
    });

    let img = new Img((pic)=>{
        io.in("guess").emit("drawing", pic);
        latestImage = pic;
    });
    

    socket.on('disconnect', ()=>{
        let user = users.removeUser(socket.id);
        
        if(user){
            
            if(user.canDraw){
                let newDrawer = switchPlayers()
                word = words.getRandomWord();
                io.emit('clearCanvas');
                io.emit('scoreBoard', users.users); 
                countDown.resetTime();
                if(!word){
                    return gameover();
                }
                io.in('draw').emit('drawer', word.name);
                socket.broadcast.emit('serverMessage', generateMessage(`Drawer`, ` has left the game. ${newDrawer.name} is now drawing`));    
            }else{
            socket.broadcast.emit('serverMessage', generateMessage(`${user.name} `, `has left the game`));
            }
        }
        if(!users.users.length){
            if(countDown){
             countDown.stopInterval();
             countDown.resetTime();
            }
        }   
    })

    socket.on('clear', ()=>{
        io.emit('clearCanvas');
    })

    function switchPlayers(user){
        if(!users.users.length){
            gameover();
            return false
        }
        let drawer = users.getDrawer();

        
        if(!drawer){
            let newDrawer = users.pickRandomGuesser();
            let newDrawerSocket = io.sockets.connected[newDrawer.id];
            newDrawerSocket.leave('guess');
            newDrawerSocket.join('draw');
            newDrawer.canDraw = true;
            countDown.resetTime();
            return newDrawer;
        }
        if(users.users.length == 1){
            countDown.resetTime();
            return drawer;
        }
        let newDrawer = users.pickRandomGuesser();
        
        let drawerSocket = io.sockets.connected[drawer.id];
        drawerSocket.leave('draw');
        drawerSocket.join('guess');
        drawer.canDraw = false;
        
        if(user){
            let newDrawerSocket = io.sockets.connected[user.id];
            newDrawerSocket.leave('guess');
            newDrawerSocket.join('draw');
            user.canDraw = true;
            countDown.resetTime();
            return user;
        }
        let newDrawerSocket = io.sockets.connected[newDrawer.id];
        newDrawerSocket.leave('guess');
        newDrawerSocket.join('draw');
        newDrawer.canDraw = true;
        countDown.resetTime();
        return newDrawer;
      }

    function chooseWord(){
        word = words.getRandomWord();
        
        io.emit('scoreBoard', users.users);
        io.emit('clearCanvas');
        if(!word){
            return gameover();
        }
        io.in("draw").emit('drawer', word.name);
        io.in("guess").emit('guess', word.category);
      }

      function gameover () {
        countDown.stopInterval();
        if(users.users.length > 0){
            io.emit('serverMessage', generateMessage(`Game Over`, `${users.users[0].name} is the winner`)); 
        }
      }
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
  })
  