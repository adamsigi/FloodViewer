from rest_framework.test import APITestCase
from urllib.parse import urlencode
from django.urls import reverse
from django.contrib.auth import get_user_model
from datetime import datetime
from api.models import Job
from api.tests.data import get_floodmap_data
from users.tests.data import user_data
from api.tests.helpers import create_floodmap
from users.tests.helpers import create_user

User = get_user_model()

class TestGetListFloodmaps(APITestCase):
    """
    Add floodmaps to the DB and assert that GET requests on the list floodmaps endpoint return the
    corresponding data.
    """

    @classmethod
    def setUpTestData(cls):
        cls.number_of_succeeded_floodmaps = 13
        for floodmap_id in range(cls.number_of_succeeded_floodmaps):
            create_floodmap(floodmap_id, Job.SUCCEEDED_STATUS)
        create_floodmap(14, Job.FAILED_STATUS)
        create_floodmap(15, Job.PROGRESSING_STATUS)
        cls.last_floodmap_id = 15
        create_user()

    def test_response_json_format(self):
        response = self.client.get(reverse('list-floodmaps'))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        # Contains only successful floodmaps
        self.assertEqual(response_json['count'],
                         self.number_of_succeeded_floodmaps)
        # pagination since number_of_succeeded_floodmaps > settings.PAGE_SIZE
        self.assertIn('page=2', response_json['next'])
        self.assertIsNone(response_json['previous'])
        # Ordering: Highest id (latest created) => first
        self.assertEqual(response_json['results'][0]['id'], self.number_of_succeeded_floodmaps - 1)

    def test_results_content(self):
        response = self.client.get(reverse('list-floodmaps'))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        results = response_json['results']
        for floodmap in results:
            id = floodmap['id']
            self.assertDictEqual(
                floodmap, {'id': id, **get_floodmap_data(id, Job.SUCCEEDED_STATUS)})

    def test_filter_by_name(self):
        response = self.client.get(reverse('list-floodmaps'),
                                   QUERY_STRING=urlencode({ "flood_name": "Test floodmap 12"}))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        self.assertEqual(response_json['count'], 1)
        results = response_json['results']
        self.assertEqual(len(results), 1)
        floodmap_12 = results[0]
        id = floodmap_12['id']
        self.assertDictEqual(floodmap_12, {'id': id, **get_floodmap_data(id, Job.SUCCEEDED_STATUS)})

    def test_filter_by_area(self):
        # Add a floodmap with different bbox.
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.SUCCEEDED_STATUS, v2=True)
        v2_data = get_floodmap_data(id, Job.SUCCEEDED_STATUS, v2=True)
        response = self.client.get(reverse('list-floodmaps'),
                                   QUERY_STRING=urlencode({  # filter bbox contains only the bbox of floodmap v2
                                       "max_lat": v2_data['bbox']['max_lat'] + 0.01,
                                       "max_lng": v2_data['bbox']['max_lng'] + 0.01,
                                       "min_lat": v2_data['bbox']['min_lat'] - 0.01,
                                       "min_lng": v2_data['bbox']['min_lng'] - 0.01,
                                    }))
        
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        results = response_json['results']
        self.assertEqual(len(results), 1)
        self.assertDictEqual(results[0], {'id': id, **get_floodmap_data(id, Job.SUCCEEDED_STATUS, v2=True)})

    def test_filter_by_date(self):
        # Add a floodmap with different date (v2).
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.SUCCEEDED_STATUS, v2=True)
        v2_data = get_floodmap_data(id, Job.SUCCEEDED_STATUS, v2=True)
        dt_obj = datetime.strptime(v2_data['flood_date'], "%Y-%m-%dT%H:%M:%SZ")
        response = self.client.get(reverse('list-floodmaps'),
                                   QUERY_STRING=urlencode({  # filter date range includes only the datetime of floodmap v2
                                       "from_date": dt_obj.strftime("%d/%m/%Y"),
                                       "to_date": dt_obj.strftime("%d/%m/%Y"),
                                    }))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        results = response_json['results']
        self.assertEqual(len(results), 1)
        self.assertDictEqual(results[0], {'id': id, **get_floodmap_data(id, Job.SUCCEEDED_STATUS, v2=True)})

    def test_filter_by_owned(self):
        response = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ 'owned': True }))
        # Cannot filter by owned if not authenticated.
        self.assertEqual(response.status_code, 400)
    
    def test_filter_by_status(self):
        response = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ 'succeeded': False }))
        # Cannot filter by status if not authenticated.
        self.assertEqual(response.status_code, 400)

    def test_results_content_auth(self):
        # Same scenario as test_results_content but with authenticated user.
        user = User.objects.get(email=user_data()['email'])
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse('list-floodmaps'))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        results = response_json['results']
        for floodmap in results:
            id = floodmap['id']
            self.assertDictEqual(
                floodmap, {'id': id, **get_floodmap_data(id, Job.SUCCEEDED_STATUS)})

    def test_filter_by_owned_auth(self):
        user = User.objects.get(email=user_data()['email'])
        self.client.force_authenticate(user=user)
        response_empty = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ 'owned': True }))
        response_empty_json = response_empty.json()
        self.assertEqual(response_empty_json['count'], 0)  # No owned floodmaps yet.
        # Create 2 floodmaps for user: 1 succeeded and 1 progressing
        progressing_id = self.last_floodmap_id + 1
        succeeded_id = self.last_floodmap_id + 2
        create_floodmap(progressing_id, Job.PROGRESSING_STATUS, user=user)
        create_floodmap(succeeded_id, Job.SUCCEEDED_STATUS, user=user)
        response = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ 'owned': True }))
        response_json = response.json()
        self.assertEqual(response_json['count'], 2)  # Contains both succeeded and progressing floodmaps.
        # Ordering: Highest id (latest created) => first
        self.assertEqual(response_json['results'][0]['id'], succeeded_id)
        self.assertEqual(response_json['results'][1]['id'], progressing_id)

    def test_filter_by_status_auth(self):
        user = User.objects.get(email=user_data()['email'])
        self.client.force_authenticate(user=user)
        progressing_id = self.last_floodmap_id + 1
        succeeded_id = self.last_floodmap_id + 2
        create_floodmap(progressing_id, Job.PROGRESSING_STATUS, user=user)
        create_floodmap(succeeded_id, Job.SUCCEEDED_STATUS, user=user)
        response = self.client.get(reverse('list-floodmaps'),
                                   QUERY_STRING=urlencode({
                                       'owned': True,
                                       'succeeded': False,
                                       'progressing': True,
                                       'failed': False
                                    }))
        response_json = response.json()
        self.assertEqual(response_json['count'], 1)
        self.assertEqual(response_json['results'][0]['id'], progressing_id)  # Contains only progressing.

    def test_invalid_filters_bbox_too_high(self):
        response = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ "max_lat": 1000, }))
        self.assertEqual(response.status_code, 400)
        response_json = response.json()
        self.assertIn('max_lat', response_json['message'])

    def test_invalid_filters_bbox_ordering(self):
        response = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ "max_lat": 10, "min_lat": 11}))
        self.assertEqual(response.status_code, 400)
        response_json = response.json()
        self.assertIn('max_lat', response_json['message'])
        self.assertIn('min_lat', response_json['message'])

    def test_invalid_filters_date_too_high(self):
        response = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ "from_date": "10/12/3000",}))
        self.assertEqual(response.status_code, 400)
        response_json = response.json()
        self.assertIn('from_date', response_json['message'])
    
    def test_invalid_filters_date_ordering(self):
        response = self.client.get(reverse('list-floodmaps'), QUERY_STRING=urlencode({ "from_date": "10/12/2020", "to_date": "9/12/2020"}))
        self.assertEqual(response.status_code, 400)
        response_json = response.json()
        self.assertIn('from_date', response_json['message'])
        self.assertIn('to_date', response_json['message'])
