package Recommend

import org.scalatest.FlatSpec

class ALSSpec extends FlatSpec{
  "config" should "be right" in {
    assert(ALSmodel.config.get("mongo.uri").get == "mongodb://localhost:27017/recommender")
    assert(ALSmodel.config.get("spark.core").get == "local[*]")
    assert(ALSmodel.config.get("mongo.db").get == "recommender")
  }
}
