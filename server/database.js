import sql from "mssql/msnodesqlv8.js";

const sqlConfig = {
  database: "Blog",
  server: "localhost",
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(sqlConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database Connection Failed! Bad Config: ", err);
    throw err;
  });

export { poolPromise };
