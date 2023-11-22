import express, {Request, Response} from "express"
import bodyParser from "body-parser"
import knex from "knex"
import cors from "cors"
import bcrypt from "bcryptjs"

const server = express()

const bancoDados = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'postgreSenha',
      database : 'Trabalho-des-web-estacio'
    }
})

server.use(bodyParser.json())
server.use(cors())


server.post("/registrar", (req: Request, resp: Response) => {
    bancoDados.select('*').from('clientes').then(data => {
        if(data.some(item => item.email === req.body.email)){
            resp.status(400).json("Esse email já está cadastrado!")
        }else{
            let passHash
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(req.body.senha, salt, function(err, hash) {
                    passHash = hash
                    bancoDados('login').returning('*').insert({
                        email: req.body.email,
                        hash: passHash
                    }).then(data => console.log(data))
                })
            })
            bancoDados('clientes').returning('*').insert({
                nome: req.body.nome,
                email: req.body.email,
            }).then(data => resp.json(data))
        }
    })
})


server.post("/login", (req: Request, resp: Response) => {
    //Conferir se o email e senha que o usuario digitar estiverem no meu banco de dados, pode entrar

    bancoDados.select('*').from('login').then(data => {
        const userIdx = data.findIndex(item => item.email === req.body.email)

        if(userIdx > -1){
            bcrypt.compare(req.body.senha, data[userIdx].hash, function(err, res) {
                if(res){
                    bancoDados.select('*').from('clientes').where({email: data[userIdx].email}).then(data => {
                        resp.json({code: 200, usuario: data[0]})
                    })
                }else{
                    resp.json({code: 300, usuario: {}})
                }
            })
        }else{
            resp.json({code: 400, usuario: {}})
        }
    })
}) 


server.listen(3000)