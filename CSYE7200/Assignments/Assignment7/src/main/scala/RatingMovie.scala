import org.apache.spark.rdd.RDD
import org.apache.spark.{SparkConf, SparkContext}

object RatingMovie {
  def main(args: Array[String]): Unit = {
    val dataPath = "resources//data//rating.csv"
    val conf = new SparkConf().setMaster("local").setAppName("reduce")
    val sc = new SparkContext(conf)
    this.rating(sc.textFile(dataPath, 3)).collect.sortBy(_._1.toInt).foreach(x => println(x._1+"\t"+x._2 +"\t"+x._3))
  }

  def rating(lines : RDD[String]) ={
    lines.filter(_.trim.length <9)
      .map(line => (line.trim().split(",")(0), line.trim.split(",")(1).toDouble))
      .groupByKey()
      .map(x => {
        var num = 0.0
        var sum = 0.0
        var std = 0.0
        for (i <- x._2) {
          sum = sum + i
          num = num + 1
        }
        val avg = sum / num
        for(i<- x._2){
          std += (i-avg)*(i-avg)
        }
        std = Math.sqrt(std/num)
        val fm1 = f"$avg%1.3f"
        val fm2 = f"$std%1.3f"
        (x._1, fm1, fm2)
      }
      ).sortBy(_._2)
  }

}
