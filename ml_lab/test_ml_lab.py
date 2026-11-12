import unittest

from cluster_preferences import fit_clusters
from generate_demo_data import DIMENSIONS, generate_dataset


class TasteprintMLLabTests(unittest.TestCase):
    def test_generator_is_reproducible(self):
        left = generate_dataset(40, seed=7)
        right = generate_dataset(40, seed=7)
        self.assertTrue(left.equals(right))

    def test_dimensions_stay_in_range(self):
        df = generate_dataset(100, seed=11)
        self.assertTrue((df[DIMENSIONS] >= 0).all().all())
        self.assertTrue((df[DIMENSIONS] <= 100).all().all())

    def test_rejects_too_few_clusters(self):
        df = generate_dataset(20, seed=13)
        with self.assertRaisesRegex(ValueError, "clusters must be an integer"):
            fit_clusters(df, clusters=1)

    def test_rejects_as_many_clusters_as_rows(self):
        df = generate_dataset(4, seed=13)
        with self.assertRaisesRegex(ValueError, "clusters must be an integer"):
            fit_clusters(df, clusters=4)

    def test_rejects_more_clusters_than_rows(self):
        df = generate_dataset(4, seed=13)
        with self.assertRaisesRegex(ValueError, "clusters must be an integer"):
            fit_clusters(df, clusters=5)

    def test_cluster_pipeline_returns_metrics(self):
        df = generate_dataset(200, seed=13)
        result, metrics = fit_clusters(df, clusters=4, seed=13)
        self.assertEqual(len(result), 200)
        self.assertIn("cluster", result.columns)
        self.assertIn("silhouette_score", metrics)
        self.assertIn("adjusted_rand_index", metrics)


if __name__ == "__main__":
    unittest.main()
