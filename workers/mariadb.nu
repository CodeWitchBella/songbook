
mkdir $"($env.FILE_PWD)/.mariadb/data"

mariadb-install-db --no-defaults $"--datadir=($env.FILE_PWD)/.mariadb/data"
(mariadbd
  --no-defaults # prevent files in home directory from interfering
  --gdb # enables ctrl-c to exit
  --datadir $"($env.FILE_PWD)/.mariadb/data"
  --socket $"($env.FILE_PWD)/.mariadb/mariadb.sock"
)
