define(
    [
        'utils/storage'
    ], 
    function(
        storage
    ) {
        return {
            getData: getData,
            calculateDistance: calculateDistance
        };
        
        function getData(maxAge, cb) {
            if (storage.has('location') && (Date.now() - storage.get('location-timestamp')) < maxAge) {
                cb(null, storage.get('location').split('-'));
            } else {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(pos) {
                        cb(null, [pos.coords.longitude, pos.coords.latitude]);
                        storage.set('session', 'location', pos.coords.longitude + '-' + pos.coords.latitude);
                        storage.set('session', 'location-timestamp', Date.now());
                    });
                } else {
                    cb('unsupported', null);
                }
            }
        }

        function calculateDistance(pos1, pos2) {
            return _formatKm(_getDistanceFromLatLonInKm(pos1[1], pos1[0], pos2[1], pos2[0]));
        }


        //////////////////////////////////////////////////////////////////////////////////
        ///// Private methods ////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
        
        function _formatKm(number) {
            number = Math.round(number * 100) / 100;

            if (number < 1) {
                return (number*1000) < 250 ? 'nearby' : (number*1000) + 'm';
            } 

            return number + 'km';
        }
            
        function _getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
            var R = 6371; // Radius of the earth in km
            var dLat = _deg2rad(lat2-lat1);  // _deg2rad below
            var dLon = _deg2rad(lon2-lon1); 
            var a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(_deg2rad(lat1)) * Math.cos(_deg2rad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ; 
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            var d = R * c; // Distance in km
            return d;
        }

        function _deg2rad(deg) {
            return deg * (Math.PI/180)
        }
    }
);
