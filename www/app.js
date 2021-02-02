//create the server by express and socket.io
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);

server.listen(2000, () => {
      console.log("server started");
  });
  
var io = require('socket.io')(server, {});

class tag{
    constructor(){
        this.players =[];
    }
    //create a chaser and push it into player list
    //the postion of chaser are randomly created
    createChaser(socket){  
        let player = {
                socket,
                role:'chaser',
                left:Math.round(Math.random()*300)+'px',              
                top:Math.round(Math.random()*500)+'px',
                id:'',
            
        }
        this.players.push(player);
        socket.player=player;
        return true;
    }
    //create a runner and push it into player list
    //the postion of runner are randomly created
    createRunner(socket){
        let player = {
                socket,
                role:'runner',
                left:Math.round(Math.random()*300)+'px',
                top:Math.round(Math.random()*500)+'px',   
                id:'',             
        }
        this.players.push(player);
        socket.player=player;
        return true;
        
    }

    //whenever one round game end, it should clear the playerlist
    restart(){
        this.players.length = 0;
    }
    //if the number of players more than 3, it should be popped.
    popFull(){
        this.players.pop();
    }
    //get the number of players
    getPlayerNum(){
        
        return this.players.length;
    }

    getPlayerRole(i){
        
        return this.players[i].role;
    }

    getPlayerLeft(i){
        return this.players[i].left;
    }

    getPlayerTop(i){
        return this.players[i].top;
    }

}


const { O_CREAT } = require('constants');
var Tag = new tag();

io.sockets.on('connection', function(socket){
    //check the connect situation of players
    console.log(socket.request.connection.remoteAddress);
    console.log('socket connection ' + socket.id);

    socket.on('chaser',function(){  
        Tag.createChaser(socket);
        console.log("One chaser created");
        //only allowed 3 players
        if(Tag.getPlayerNum() <= 3){
            socket.emit('connected',{
                num:Tag.getPlayerNum(),
                role: socket.player.role,
                left:socket.player.left,
                top:socket.player.top,  
            })
        }

        //when the game start, broadcast all information to client side
        if(Tag.getPlayerNum() == 3){

            for(var i = 0; i < Tag.getPlayerNum();i++){
                broadCast(i);
            }
            //if all player choose chaser then randomly pick one player as runner
            if(Tag.getPlayerRole(0)=="chaser"&&Tag.getPlayerRole(1)=="chaser"&&Tag.getPlayerRole(2)=="chaser"){
                io.sockets.emit('Allchaser',{
                    id:Math.floor(Math.random()*3)
                })
            }
            //startcoutdown
            broadCastTime();
        }

        if(Tag.getPlayerNum() > 3){
            console.log(Tag.getPlayerNum());
            Tag.popFull();
        }
    
    });

    socket.on('runner',function(){

        Tag.createRunner(socket);
        console.log("One runner created");
        if(Tag.getPlayerNum() <= 3){
            socket.emit('connected',{
                num:Tag.getPlayerNum(),
                role: socket.player.role,
                left:socket.player.left,
                top:socket.player.top,
            })
        }
        //when the game start, broadcast all information to client side
        if(Tag.getPlayerNum() == 3){
            for(var i = 0; i < Tag.getPlayerNum();i++){
                broadCast(i);
            }
            //if all player choose runner then randomly pick one player as runner
            if(Tag.getPlayerRole(0)=="runner"&&Tag.getPlayerRole(1)=="runner"&&Tag.getPlayerRole(2)=="runner"){
                io.sockets.emit('AllRunner',{
                    id:Math.floor(Math.random()*3)
                })
            }
            broadCastTime();
        }
        
        if(Tag.getPlayerNum() > 3){
            console.log(Tag.getPlayerNum());
            Tag.popFull();
        }

    });

    //update the top of position from server to clents side
    socket.on('ownDotTop',function(data){
        if(Tag.getPlayerNum()==3){
            for(var i = 0; i < Tag.getPlayerNum();i++){
                if( data.id == i){
                    Tag.players[i].top = data.top;
                }
            }

            for(var i = 0; i < Tag.getPlayerNum();i++){
                moveDot(i);
            } 
        }

    });
    //update the left of position from server to clents side
    socket.on('ownDotLeft',function(data){
        if(Tag.getPlayerNum()==3){
            for(var i = 0; i < Tag.getPlayerNum();i++){
                if(data.id == i){
                    Tag.players[i].left = data.left;
                }
            }
            for(var i = 0; i < Tag.getPlayerNum();i++){
                moveDot(i);
            }
        }
    });
    //one client meet the powerup ball then boardcast to every clients
    socket.on('powerup1Disappear',function(data){
        io.sockets.emit('powerup1boardCast',{
            role:data.role
        })
    });
    socket.on('powerup2Disappear',function(data){
        io.sockets.emit('powerup2boardCast',{
            role:data.role
        })
    });
    socket.on('chaserPowerup2',function(data){
        io.sockets.emit('pu2chaseBoardCast',{
            role:data.role,
            id:data.id
        })
    });
    socket.on('runnerPowerup2',function(data){
        io.sockets.emit('pu2runnerBoardCast',{
            role:data.role,
            id:data.id
        })
    });

    //one chaser meet the runner then boardcast to every players
    socket.on('runnerChased',function(data){
        io.sockets.emit('runnerChasedBoardCast',{
            role:data.role,
            rToCid:data.rToCid,
            cToRid:data.cToRid,
        })        
    });

    socket.on('restartGame',function(data){
        Tag.restart();
    });
})

function broadCast(i){
  io.sockets.emit('getCheckBroad',{
      id:i,
      role:Tag.getPlayerRole(i),
      leftPostion: Tag.getPlayerLeft(i),
      topPostion: Tag.getPlayerTop(i)
  })
}

function broadCastTime(){
  io.sockets.emit('getTime',{
  })
}

function moveDot(i){
  io.sockets.emit('move',{
      id:i,
      role:Tag.getPlayerRole(i),
      leftPostion: Tag.getPlayerLeft(i),
      topPostion: Tag.getPlayerTop(i)
  })
}

