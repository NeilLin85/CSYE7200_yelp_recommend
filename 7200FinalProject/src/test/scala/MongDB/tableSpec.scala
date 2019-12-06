package MongDB

import MongoDB.BuildBigTable
import org.apache.spark.ml.recommendation.ALS.Rating
import org.scalatest.FlatSpec

class tableSpec extends FlatSpec {

  "config" should "be right" in {
    assert(BuildBigTable.config.get("mongo.uri" ).get=="mongodb://localhost:27017/recommender")
    assert(BuildBigTable.config.get("spark.core" ).get=="local[*]")
    assert(BuildBigTable.config.get("mongo.db" ).get=="recommender")


  }
}
