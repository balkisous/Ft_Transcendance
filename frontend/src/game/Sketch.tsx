import { P5CanvasInstance, P5WrapperClassName, P5WrapperProps } from 'react-p5-wrapper'
import Puck from "./puck";
import Paddle from './paddle';
import Confetti from 'react-confetti'
import { useState, useEffect } from "react";
import { Socket, io } from 'socket.io-client';
import { useRef } from 'react';
import authenticationService from "@/services/authentication-service";
import { MySketchProps } from '@/components/Game';
import React from 'react';
import userService from '@/services/user-service';
import { useRouter } from "next/router";

  export default function sketch(p5: P5CanvasInstance<MySketchProps>) {

    // in CSS for p5 Wrapper set with and height
    // like this it's can be responssive
    
    let p5WrapperDiv = document.getElementById("canvas_size")
   
    // fixed canvas in backend
    const canvasw = 1000;
    const canvash = 1000;
    
    let cwidth = p5WrapperDiv?.clientWidth || window.innerWidth;
    let cheight = p5WrapperDiv?.clientHeight || window.innerHeight;
    // Calculate the aspect ratio of the canvas and window
    const canvasratio = canvasw / canvash;
    const winratio = cwidth / cheight;

    // Calculate the available width and height based on the aspect ratio
    let width: number;
    let height: number;

    if (winratio > canvasratio) {
      height = cheight;
      width = height * winratio;
    } else {
      width = cwidth;
      height = width / canvasratio;
    }
    
      let puck = new Puck(p5, width, height)
      let paddle_left = new Paddle(p5, width, height, true, false);
      let paddle_right = new Paddle(p5, width, height, false, false);
      let left_score: number = 0;
      let right_score: number = 0;
      
      //const token =  AuthService.getToken();
      let left = false;
      let puckx: number;
      let pucky: number
      
      let padr_x: number;
      let padr_y: number;
      let padr_w: number;
      let padr_h: number;
      let padr_n: string;
    
    let padl_x: number;
    let padl_y: number;
    let padl_w: number;
    let padl_h: number;
    let padl_n: string; 


    // const userdata = {
    //   id: AuthService.getId(),
    //   name: AuthService.getUsername(),
    // };
    
    
    p5.updateWithProps = props => {
      let socket = props.socket.current;
      //const socketRef = useRef<Socket | null>(null);
      
      const payload = {width: width, height: height, id: props.id, name: props.username}
      
      if (props.socket) {
        if (socket)
        {
          socket.emit("start game", payload);
          
          socket.on("puck update", (payload : any) => {
            
            puckx = payload.x; 
            pucky = payload.y;
            left_score = payload.lscore;
            right_score = payload.rscore;
            //puck.show(puckx, pucky);
            
            // need data for showwing the ball we need
            // puck.x, puck.y, puck.r
            // to show
          });
          
          socket.on("end game", () => {
            window.location.href = "/home_game";
          });

          socket.on("paddle update", (payload : any) => {
            padl_x = payload.plx; 
            padl_y = payload.ply;
            padl_w = payload.plw;
            padl_h = payload.plh;
            padl_n = payload.pln;
            
            padr_x = payload.prx; 
            padr_y = payload.pry;
            padr_w = payload.prw;
            padr_h = payload.prh;
            padr_n = payload.prn;
            
            // need data for showwing the paddle we need
            // to show
          });

          socket?.on("user left", () => {
          
            left = true;
          });       
          // keyReleased and keyPressed for the gamers
          p5.keyReleased = () => {
            socket?.emit("KeyReleased");
          }

          p5.keyPressed = () => {
            if (p5.key == 'w')
              socket?.emit("KeyPressed", {id: props.id, key: 'w'});
            else if (p5.key == 's') {
              socket?.emit("KeyPressed", {id: props.id, key: 's'});
            }
          }
        }
      }
    };
    
  // Puck Class
  // Paddle Class



  window.addEventListener('resize', windowResized);
  p5.setup = () => {
    p5.createCanvas(width, height);
  }

  p5.draw = () => {
    p5.background(0);
    let score = 5
    if (left_score == score || right_score == score || left == true) {
      if (left_score == score) {
        p5.text("End Game", width / 2 - 100, height / 2 - 50);
        let str = "Player " + paddle_left.name + " win !!"
        p5.fill(0, 102, 153);
        p5.text(str, width / 2 - 225, height / 2 + 50)
        return ;
      }
      if (right_score == score) {
        p5.text("End Game", width / 2 - 100, height / 2 - 50);
        let str = "Player " + paddle_right.name + " win !!"
        p5.fill(0, 102, 153);
        p5.text(str, width / 2 - 225, height / 2 + 50)
        return ;
      }
      if (left == true)
      {
        p5.text("End Game", width / 2 - 100, height / 2 - 50);
        let str = "User left the game, You win !!"
        p5.fill(0, 102, 153);
        p5.text(str, width / 2 - 225, height / 2 + 50)
        return ;
      }
    }
    else {
      center_bar();

      paddle_left.show(false, padl_x, padl_y, padl_w, padl_h, padl_n);
      paddle_right.show(false, padr_x, padr_y, padr_w, padr_h, padr_n);
      puck.show(puckx, pucky);
      // show scores
      p5.fill(255);
      p5.textSize(45);
      p5.text(left_score, width / 2 - 35, 40)
      p5.text(paddle_left.name, 100, 40)
      p5.text(right_score, width / 2 + 30, 40)
      p5.text(paddle_right.name, width - 100, 40)
    }
  };


  const center_bar = () => {
    for (let i: number = 0; i < height; i += 10) {
      p5.rect(width / 2 + 8, i, 10, 15);
      i += 10;
    }
  }
  
  function windowResized() {
    var element = document.getElementById("canvas_size");
    if (element == null)
    {
      cwidth = window.innerWidth;
      cheight = window.innerHeight;
    }
    else
    {
      cwidth = element.clientWidth;
      cheight = element.clientHeight;
    }
    // send to back new width and height to upfate whith puck paddle

    // new winratio
    
    const winratio = cwidth / cheight;

    if (winratio > canvasratio) {
      height = cheight;
      width = height * winratio;
    } else {
      width = cwidth;
      height = width / canvasratio;
    }
    

    p5.resizeCanvas(width, height);
    paddle_left.update_resize(width, height, true);
    paddle_right.update_resize(width, height, false);
    puck.update_resize(width, height);
  }
}