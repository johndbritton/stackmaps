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

        // Set up the infowindow
        var infowindow = new google.maps.InfoWindow();

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
          }
        });

        function getUsers(site) {
          $.ajax({
            url: 'http://api.stackexchange.com/2.0/users',
            type: 'GET',
            data: 'pagesize=10&order=desc&sort=reputation&page=' + page  + '&site=' + site.api_site_parameter,
            success: function(data) {
              clearOverlays();
              has_more = data.has_more;
              $.each(data.items, function(i, user) {
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
              var marker = new google.maps.Marker({
                position: new google.maps.LatLng(place.latitude, place.longitude),
                map: map,
                title: user.display_name,
                user: user,
              });
              markers.push(marker);
              google.maps.event.addListener(marker, 'click', function(){
                infowindow.setContent(
                  '<img src="' + marker.user.profile_image + '" />' +
                  marker.user.display_name
                );
                infowindow.open(map, marker);
              });
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

