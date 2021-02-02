const TIME = 2000;
var lastClickTime = 0;

function isFastDoubleClick() {
    var currentTime = Date.parse(new Date());
    var timeInterval = currentTime - lastClickTime;
    if (0 < timeInterval && timeInterval < TIME) {
        return true;
    }
    lastClickTime = currentTime;
    return false; 
}

//Obtain rhe IP adress to connect with server
var newGame = document.getElementById("ipButton");
var ipInput = document.getElementById('ipInput');

newGame.addEventListener('click', onDeviceReady);

//The direction button to control the players' moving
var upButton = document.querySelector(".up");
var downButton = document.querySelector(".down"); 
var leftButton = document.querySelector(".left");
var rightButton = document.querySelector(".right");

//Two power up chance
var powerup1 = document.getElementById('p1');
var powerup2 = document.getElementById('p2');
var ownDot = document.querySelector(".ownDot");

var widthScreen = document.documentElement.clientWidth;
var heightScreen = document.documentElement.clientHeight;

function onDeviceReady() {
    const ip = ipInput.value;
    socket = io.connect('http://'+ip+':2000');
    console.log(ip);
    console.log('click button');

    //Player can choose to be a chaser or runner and updated to the server
    var chaserAction = document.querySelector(".chaser");
    var chaserClick = Rx.Observable.fromEvent(chaserAction, 'click');
    chaserClick.subscribe(function() {
        if(!isFastDoubleClick()){
            console.log('chaser');
            socket.emit('chaser',{
                role:'chaser',
            });
        }

    });

    var runnerAction = document.querySelector(".Runner");
    var runnerClick = Rx.Observable.fromEvent(runnerAction, 'click');
    runnerClick.subscribe(function() {
        if(!isFastDoubleClick()){
            socket.emit('runner',{
                role:'runner',
            });
        }

    });

    //when player chosed their role and the number of player <= 3 in one round, they will connect to the game page
    var startPage = document.querySelector(".page-start");
    var notice = document.getElementById('noticeWaitting');
    var ballPage = document.querySelector(".move-ball");

    var connected = Rx.Observable.fromEvent(socket,'connected');
    connected.subscribe(function(data){
        console.log("connect");
        startPage.style.display = "none";
        console.log(data);
        
        //In this game, only 3 player allowed
        //if the number of player is smaller than 3, game can not be start
        if(data.num < 3){
            notice.style.display="inline";
        }
        
        ownDot.style.left = data.left; 
        ownDot.style.top = data.top; 

        if(data.role == 'chaser'){
            ownDot.innerText='chaser';
            ownDot.style.backgroundImage = "url(./img/chaser.png)";
        }

        if(data.role == 'runner'){
            ownDot.innerText='runner';
            ownDot.style.backgroundImage = "url(./img/runner.png)";
        }
        ownDot.style.display = 'none';
    })
        
    //Show the game result and Back to the Home page
    var restart = document.getElementById('result');
    var resultConfirm = document.getElementById('resultConfirm');
    var resultClick = Rx.Observable.fromEvent(resultConfirm, 'click');
    resultClick.subscribe(function() {
        startPage.style.display = "inline";
        result.style.display = 'none';
        resultConfirm.style.display = 'none';
        window.location.reload();

    })

    //One round game in time limit for 60s
    //the time also can be viewed in the game page
    var getTime = Rx.Observable.fromEvent(socket,'getTime');
    var countDownS = document.querySelector(".countdown");
    getTime.subscribe(function(){
        var maxtime = 60;
        var timer = setInterval(function(){
            if (maxtime >= 0) {
                minutes = Math.floor(maxtime / 60);
                seconds = Math.floor(maxtime % 60);           
                msg = "0" + minutes + " ：" + ((seconds < 10) ? "0" + seconds : seconds);
                countDownS.innerHTML = msg;
                --maxtime;
        } else{
            //when the game end, it will decide the player is win or lose
            clearInterval(timer);
            console.log(ownDot.innerText);
            if(ownDot.innerText == "runner"){ //runner means they do not have been taged at final moment           
                result.innerText ="Congratulate! You Are Winner!";            
            }else if(ownDot.innerText == "chaser"){ //chaser still have the "tag" at the final moment
                result.innerText ="Sorry for this round:(";
            }

            result.style.display = 'inline';
            resultConfirm.style.display = 'inline';
            powerup1.style.display = "none";
            powerup2.style.display = "none";
            for(var i = 0 ; i < 3;i++){
                ballPage.removeChild(document.getElementById(i));
            }
            socket.emit('restartGame',{
                msg:'restart'
            });
            //when the game end, disconnect with the server
            socket.disconnect();
            console.log('disconnect');

        }
        },1000);
    })


    //got infomation and updated the game page from server
    var getCheckBroad = Rx.Observable.fromEvent(socket,'getCheckBroad');
    getCheckBroad.subscribe(function(data){
        var ballPage = document.querySelector(".move-ball");
        startPage.style.display = "none";
        var noticeWaitting = document.getElementById('noticeWaitting');
        if(noticeWaitting){
            noticeWaitting.style.display = 'none';
        }

        ownDot.style.display = 'inline';
        
        powerup1.style.display = 'inline';
        powerup2.style.display = 'inline';

        console.log(data);
        var dot = document.createElement("div");

        dot.id = data.id;
        dot.style.textAlign='center';
        dot.style.lineHeight=50+'px';
        dot.style.width = 50+'px';
        dot.style.height = 50+'px';
        dot.style.position="absolute";     
        dot.style.backgroundSize = 'contain' ; 

        if(data.role == 'chaser'){
            dot.innerText='chaser';           
            dot.style.backgroundImage = "url(./img/chaser.png)";
        }else if(data.role == 'runner'){
            dot.innerText='runner';
            dot.style.backgroundImage = "url(./img/runner.png)";
        }
        dot.style.color="transparent";
        dot.style.position="absolute";
        dot.style.left = data.leftPostion; 
        dot.style.top = data.topPostion; 
        
        if(ownDot.style.left != data.leftPostion && ownDot.style.top != data.topPostion){
            ballPage.appendChild(dot);
        }else{
            ownDot.id = data.id;
        }
        
    })
    //whenever click the up button, it will rise 2px in screen
    var upClick = Rx.Observable.fromEvent(upButton, 'click');
    upClick.subscribe(function() {
        //make sure the move would not be outside the screen
        if(parseInt(ownDot.style.top) - 2 >= 0){
            ownDot.style.top = parseInt(ownDot.style.top) - 2 + 'px';
        }
        //the postion also updated to he server
        socket.emit('ownDotTop',{
            role:ownDot.innerText,
            top:ownDot.style.top,
            id:ownDot.id
        });
        powerUpOne(ownDot,powerup1);
        powerUpTwo(ownDot,powerup2);
    });

    //whenever click the down button, it will go down 2px in screen
    var downClick = Rx.Observable.fromEvent(downButton, 'click');
    downClick.subscribe(function() {
        //make sure the move would not be outside the screen
        if(parseInt(ownDot.style.top) + 2 <= heightScreen){
            ownDot.style.top = parseInt(ownDot.style.top) + 2 + 'px';
        }
        //the postion also updated to he server
        socket.emit('ownDotTop',{
            role:ownDot.innerText,
            top:ownDot.style.top,
            id:ownDot.id
        });
        powerUpOne(ownDot,powerup1);
        powerUpTwo(ownDot,powerup2);
    });

    //whenever click the left button, it will move 2px to left in screen
    var leftClick = Rx.Observable.fromEvent(leftButton, 'click');
    leftClick.subscribe(function() {
        //make sure the move would not be outside the screen
        if(parseInt(ownDot.style.left) - 2 >= 0){
            ownDot.style.left = parseInt(ownDot.style.left) - 2 + 'px';
        }
        //the postion also updated to he server
        socket.emit('ownDotLeft',{
            role:ownDot.innerText,
            left:ownDot.style.left,
            id:ownDot.id
        });
        powerUpOne(ownDot,powerup1);
        powerUpTwo(ownDot,powerup2);
    });
    //whenever click the right button, it will move 2px to right in screen
    var rightClick = Rx.Observable.fromEvent(rightButton, 'click');
    rightClick.subscribe(function() {
        //make sure the move would not be outside the screen
        if(parseInt(ownDot.style.left)  + 2 <= widthScreen){
            ownDot.style.left = parseInt(ownDot.style.left) + 2 + 'px';
        }
        //the postion also updated to he server
        socket.emit('ownDotLeft',{
            role:ownDot.innerText,
            left:ownDot.style.left,
            id:ownDot.id
        });
        powerUpOne(ownDot,powerup1);
        powerUpTwo(ownDot,powerup2);
    });

    //when the server received the movement of players, it would broadcast to each client-side to updated the position of every players
    var move = Rx.Observable.fromEvent(socket,'move');
    move.subscribe(function(data){
        var id = data.id;
        document.getElementById(id).style.top = data.topPostion;
        document.getElementById(id).style.left = data.leftPostion;

        //I designed a rule that when chaser and runner are totally meet, the position are almost same, the chaser caught the runner
        //as well as tag the runner. Then the runner will become chaser, and the chaser become runner
        if(ownDot.innerText == "chaser" && document.getElementById(id).innerText == "runner"){
            if(Math.abs(ownDot.offsetLeft - document.getElementById(id).offsetLeft) <= 1 && Math.abs(ownDot.offsetTop - document.getElementById(id).offsetTop) <= 1){
                console.log("catched");
                    socket.emit('runnerChased',{
                        role:document.getElementById(id).innerText,
                        rToCid:id,
                        cToRid:ownDot.id,
                    })
            }
        }
    })

    //both power up 1 and 2 only can be used one time one round
    //it will be updated to server and broadcast to each player-side
    var powerup1boardCast = Rx.Observable.fromEvent(socket,'powerup1boardCast');
    powerup1boardCast.subscribe(function(){
        document.getElementById('p1').style.display = "none"        
    })
    var powerup2boardCast = Rx.Observable.fromEvent(socket,'powerup2boardCast');
    powerup2boardCast.subscribe(function(){
        document.getElementById('p2').style.display = "none"       
    })

    //when chaser totally meet the power up chance 2, chaser will disappear in the screen for 5s
    var pu2chaseBoardCast = Rx.Observable.fromEvent(socket,'pu2chaseBoardCast');
    pu2chaseBoardCast.subscribe(function(data){
        var id = data.id;
        document.getElementById(id).style.display = "none";
        setTimeout(function(){document.getElementById(id).style.display = "	inline"},5000);
    })
    //when runner totally meet the power up chance 2, chaser will disappear in the screen for 10s
    var pu2runnerBoardCast = Rx.Observable.fromEvent(socket,'pu2runnerBoardCast');
    pu2runnerBoardCast.subscribe(function(data){
        // console.log(data.role);
        var id = data.id;
        document.getElementById(id).style.display = "none";
        setTimeout(function(){document.getElementById(id).style.display = "	inline"},10000);
        
    })
    //when recevied the info of chaser tagged the runner, the role would be changed
    var runnerChasedBoardCast = Rx.Observable.fromEvent(socket,'runnerChasedBoardCast');
    runnerChasedBoardCast.subscribe(function(data){
        var idC = data.rToCid;
        var idR = data.cToRid;
        document.getElementById(idC).innerText = 'chaser';
        document.getElementById(idC).style.color='transparent';   
        document.getElementById(idC).style.backgroundImage = "url(./img/chaser.png)";

        document.getElementById(idR).innerText = 'runner';
        document.getElementById(idR).style.color='transparent';
        document.getElementById(idR).style.backgroundImage = "url(./img/runner.png)";
    })

    //If three player all chose chaser, the server would chose one player to runner randomly
    //it also updated from server to client
    var Allchaser = Rx.Observable.fromEvent(socket,'Allchaser');
    Allchaser.subscribe(function(data){
        var id = data.id;
        document.getElementById(id).innerText = "runner";
        document.getElementById(id).style.color='transparent';
        document.getElementById(id).style.backgroundImage = "url(./img/runner.png)";
    })
    //same rule as runner
    var AllRunner = Rx.Observable.fromEvent(socket,'AllRunner');
    AllRunner.subscribe(function(data){
        var id = data.id;
        document.getElementById(id).innerText = "chaser";
        document.getElementById(id).style.color='transparent';     
        document.getElementById(id).style.backgroundImage = "url(./img/chaser.png)";
    })

}

function powerUpOne(dot, powerup1){
    if(Math.abs(dot.offsetLeft - powerup1.offsetLeft) <= 2 && Math.abs(dot.offsetTop - powerup1.offsetTop) <= 2){
        socket.emit('powerup1Disappear',{
            role:powerup1.innerText,
        });

        var upClick = Rx.Observable.fromEvent(upButton, 'click');
        var downClick = Rx.Observable.fromEvent(downButton, 'click');
        var leftClick = Rx.Observable.fromEvent(leftButton, 'click');
        var rightClick = Rx.Observable.fromEvent(rightButton, 'click');

        //when chaser totally met power up1, The distance the player moves with one click is twice as long.
        //Whenever the postion changed, it will emit to the server
        if(dot.innerText == "chaser"){ //chaser
            upClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.top) - 4 >= 0){
                    dot.style.top = parseInt(dot.style.top) - 4 + 'px';
                }
                socket.emit('ownDotTop',{
                    role:dot.innerText,
                    top:dot.style.top,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });
            
            downClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.top) + 4 <= heightScreen){
                    dot.style.top = parseInt(dot.style.top) + 4 + 'px';
                }
                socket.emit('ownDotTop',{
                    role:dot.innerText,
                    top:dot.style.top,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });
            
            leftClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.left) - 4 >= 0){
                    dot.style.left = parseInt(dot.style.left) - 4 + 'px';
                }
                socket.emit('ownDotLeft',{
                    role:dot.innerText,
                    left:dot.style.left,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });

            rightClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.left) + 4 <= widthScreen){
                    dot.style.left = parseInt(dot.style.left) + 4 + 'px';
                }
                socket.emit('ownDotLeft',{
                    role:dot.innerText,
                    left:dot.style.left,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });
        //when runner totally met power up1, Players can move four times as long as they click once.
        }else if(dot.innerText == "runner"){ //runner
            upClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.top) - 8 >= 0){
                    dot.style.top = parseInt(dot.style.top) - 8 + 'px';
                }
                socket.emit('ownDotTop',{
                    role:dot.innerText,
                    top:dot.style.top,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });

            downClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.top) + 8 <= heightScreen){
                    dot.style.top = parseInt(dot.style.top) + 8 + 'px';
                }
                socket.emit('ownDotTop',{
                    role:dot.innerText,
                    top:dot.style.top,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });

            leftClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.left) - 8 >= 0){
                    dot.style.left = parseInt(dot.style.left) - 8 + 'px';
                }
                socket.emit('ownDotLeft',{
                    role:dot.innerText,
                    left:dot.style.left,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });

            rightClick.subscribe(function(){
                dot.style.position="absolute";
                if(parseInt(dot.style.left) + 8 <= widthScreen){
                    dot.style.left = parseInt(dot.style.left) + 8 + 'px';
                }
                socket.emit('ownDotLeft',{
                    role:dot.innerText,
                    left:dot.style.left,
                    id:dot.id
                });
                powerUpTwo(dot,powerup2);
            });

        }
    }
    
}

function powerUpTwo(dot, powerup2){
    //when the player totally meet the power up  ball, it would updated the player's role and id to the server
    if(Math.abs(dot.offsetLeft - powerup2.offsetLeft) <= 2 && Math.abs(dot.offsetTop - powerup2.offsetTop) <= 2){
        socket.emit('powerup2Disappear',{
            role:powerup2.innerText,
        });

        if(dot.innerText == "chaser"){ //chaser
            socket.emit('chaserPowerup2',{
                role:dot.innerText,
                id:dot.id
            });
        }else if(dot.innerText == "runner"){ //runner

            socket.emit('runnerPowerup2',{
                role:dot.innerText,
                id:dot.id
            });
        }
    }
}

