const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
//const path = require('path');
const static = require('serve-static');
//const https = require('https');
const dbconfig = require('../config/dbconfig.json');
//const fs = require('fs');
//const bodyParser = require('body-parser');
const port = 3003;


const app = express();
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors());

//파일의 중요정보들을 /config/dbconfig내에 모아서 불필요한 노출을 최소화
//필요시 참조해서 사용
//서버내의 데이터베이스 정보를 이용해서 서버와 MySQL을 연결
const db = mysql.createConnection({
    host: dbconfig.host,
    port: dbconfig.port,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database
});


//서버와 MySQL DB를 연결시킨 후 연결이 잘 되었는지 쿼리문을 통해 확인
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database');
    db.query('SELECT * FROM login', (err, results, fields) => {
        if (err) {
            console.error('Error querying the database: ' + err);
            return;
        }

        // 결과를 콘솔에 출력
        console.log('Database data:');
        console.log(results);
    });
});



//adduser.html에서 서버의 /adduser경로에 대해서 라우팅 요청을 하면 그에 맞는 응답을 하게 해주는 코드
app.post("/adduser", (req, res) => {
    //adduser.html에서 요청을 보낼 때, form내부의 name, password정보를 server.js의 name,password변수에 저장
    const { name, password } = req.body;
    
    //서버와 연결된 DB에 값을 입력시키는 쿼리문
    const query = 'INSERT INTO login (name, password) VALUES (?, ?)';

    //query에 할당한 쿼리문을 앞서 저장한 name,password변수에 대해서 실행
    db.query(query, [name, password], (err, result) => {
        if (err) {
            console.error('Error inserting data: ' + err);
           //status(500)에 해당하는 오류 발생시, 쿼리문을 실행하지 않고, 다시 adduser.html로 반환
            return res.status(500).send("<script>alert('이미 존재하는 id입니다.'); window.location.href='http://realmeta.co.kr/Logintest/public/adduser.html';</script>");
        }

        if (result) {
            console.log('Inserted 성공');
           //쿼리문 실행 성공시, DB에 정보를 추가하고, 로그인을 위해 Login.html창으로 이동
           res.send("<script>alert('사용자 추가 성공'); window.location.href='http://realmeta.co.kr/Logintest/Login.html';</script>");
        }
      
    });
});



//Login.html에서 현재 입력받은 정보를 확인받기 위해 DB내의 정보와 비교하기 위한 함수
app.post("/LoginCheck",(req,res)=>{
    //Login.htlml의 form태그 내에 입력받은 id와 password에 대한 정보를 server.js의 name,password 변수에 할당
    const {name,password}=req.body;

    //DB내에 특정 키값에 대한 정보를 확인하기 위한 쿼리문
    //Select name From login Where name=?로 쿼리문을 실행할 경우 Password를 받아오지 못해서 해당 name에 대해 password가 맞는지 확인할 수 없기 때문에
    //비교는 name만 하지만 DB로부터 name과 password를 모두 가져와야한다.
    const query='Select name,password FROM login WHERE name=?';

    //query에 할당한 쿼리문을 Login.html에서 할당받은 name변수에 대해서 비교
    db.query(query,[name],(err,result)=>{
        if (err) {
            console.error('Error inserting data: ' + err);
            return res.status(500).send('Error inserting data');
        }

        //해당 name에 해당하는 키 값이 DB내에 존재하는경우
        if (result.length > 0) {
            // 사용자 정보가 일치하는 경우
            if (result[0].password === password) {
              //res.status(200).send('로그인 성공');
              res.status(200).send("<script>alert('로그인 성공'); window.location.href='http://realmeta.co.kr';</script>");
            } else {
              //res.status(401)오류와 함께 Login.html창으로 반환
              res.status(401).send("<script>alert('비밀번호가 일치하지 않습니다.');window.location.href='http://realmeta.co.kr/Logintest/Login.html';</script>");
            }
          } 
          
          //해당 name에 해당하는 키 값이 DB내에 존재하지 않는 경우
          else {
           // res.status(404)오류와 함께 Login.html창으로 반환
           res.status(404).send("<script>alert('사용자가 존재하지 않습니다.');window.location.href='http://realmeta.co.kr/Logintest/Login.html';</script>");
          }
    })
})






//adduer.html을 통해서 회원가입을 하기위해 보안을 강화하기 위한 용도로 2차 공통 보안비밀번호를 확인하는 함수
//서버의 /chekSecurityPassword경로로 요청을 받음
app.post('/checkSecurityPassword', (req, res) => {
    //json형태로 전달받은 prompt에 작성된 SCPassword정보를 clientSecurityPassword에 할당
    const clientSecurityPassword = req.body.securityPassword;

    //할당받은 보안 비밀번호와 dbconfig에 입력해놓은 비밀번호가 일치하는지 확인
    const isValid = (clientSecurityPassword === dbconfig.SCPassword);
   
    //adduer.html로 일치여부에 대한 isValid(bool)변수를 반환
    res.json({ isValid });
});











app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

