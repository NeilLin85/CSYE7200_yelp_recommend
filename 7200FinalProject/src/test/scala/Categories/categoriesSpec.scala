package Categories


import org.scalatest.FlatSpec


class categoriesSpec extends FlatSpec{
  "Source data" should "be int right place" in{
    assert(businessCategories.business_path =="/Users/yiqiangwang/IdeaProjects/7200FinalProject/source/yelp_academic_dataset_business.json" )
  }
}

