      $(document).ready(function(){


      $( window ).resize(
        function(){
          // Resize the map.
          $('#map').height(
            $( window ).height() - $('#header').height()
          );
        }
      );
      $( window ).resize();


        // Set up storage
        var sites = [];
        var users = [];
        var markers = [];

        // Set up state
        var has_more = false;
        var page = 1;

        // Set up the map
        var mapOptions = {
          zoom: 2,
          center: new google.maps.LatLng(0, 0),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map"), mapOptions);

       function clearOverlays() {
          $.each(markers, function(i, marker) {
            marker.setMap(null);
            marker = null;
          });
        }

        // Set up site select
        $('.chzn-select').chosen();
        $('.chzn-select').focus();

        // Get sites
        $.ajax({
          url: 'http://api.stackexchange.com/2.0/sites',
          type: 'GET',
          data: 'pagesize=10000',
          success: function(data) {
            sites = data.items;
            $.each(sites, function(i, site) {
              $('#sites').append('<option value=' + i + '>' + site.name + '</option>');
            });
            $("#sites").trigger("liszt:updated");
console.log(data);
          }
        });

        function getUsers(site) {
          $.ajax({
            url: 'http://api.stackexchange.com/2.0/users',
            type: 'GET',
            data: 'pagesize=100&order=desc&sort=reputation&page=' + page  + '&site=' + site.api_site_parameter,
            success: function(data) {
              clearOverlays();
              users = data.items;
              has_more = data.has_more;
              $.each(users, function(i, user) {
                geocodeUser(user);
              });
            }
          });
        }

        function geocodeUser(user) {
          $.ajax({
            url: 'http://where.yahooapis.com/geocode',
            type: 'GET',
            data: 'flags=j&q=' + user.location,
            success: function(data) {
              var place = data.ResultSet.Results[0];
              marker = new google.maps.Marker({
                position: new google.maps.LatLng(place.latitude, place.longitude),
                map: map,
                title: user.display_name
              });
              markers.push(marker);
            }
          });
        }

        // Respond to site selection
        $('#sites').change(function(){
          $("#sites option:selected").each(function () {
            var site = sites[$(this).attr("value")];
            getUsers(site);
          });
        });

      });

