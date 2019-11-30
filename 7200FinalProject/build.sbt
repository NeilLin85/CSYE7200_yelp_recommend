name := "7200FinalProject"

version := "0.1"

version := "0.1.0"

scalaVersion := "2.11.11"

libraryDependencies +=
  "org.apache.spark" %% "spark-core" % "2.2.0"


libraryDependencies += "org.apache.spark" % "spark-streaming_2.11" % "2.2.0"

libraryDependencies += "org.apache.spark" % "spark-mllib_2.11" % "2.2.0"

libraryDependencies += "org.apache.spark" %% "spark-hive" % "2.2.0" % "provided"

libraryDependencies += "org.apache.spark" % "spark-sql_2.11" % "2.2.0"

libraryDependencies += "org.apache.spark" % "spark-streaming-kafka-0-8_2.11" % "2.2.0"

libraryDependencies += "org.apache.spark" % "spark-streaming-flume_2.11" % "2.2.0"

libraryDependencies += "org.apache.spark" % "spark-hive_2.11" % "2.2.0" % "provided"

libraryDependencies += "org.scalanlp" % "breeze_2.11" % "0.11"

libraryDependencies += "org.scalanlp" % "breeze-natives_2.11" % "0.11"

libraryDependencies += "org.apache.hadoop" % "hadoop-common" % "2.6.0"

// https://mvnrepository.com/artifact/org.mongodb.spark/mongo-spark-connector
libraryDependencies += "org.mongodb.spark" %% "mongo-spark-connector" % "2.2.6"

// https://mvnrepository.com/artifact/org.mongodb/casbah-core
libraryDependencies += "org.mongodb" %% "casbah-core" % "3.1.1"
// https://mvnrepository.com/artifact/org.jblas/jblas
libraryDependencies += "org.jblas" % "jblas" % "1.2.4"




