gulp prod
ssh oceanstar 'mkdir -p ~/www/es6'
scp -r ../build/* oceanstar:~/www/es6
