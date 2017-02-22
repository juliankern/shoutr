define(
    [
        '$', 
        '_',
        'utils/api'
    ], 
    function(
        $, 
        _,
        api
    ) {
        return {
            hasRight: hasRight,
            isCurrent: isCurrent,
            getCurrentId: getCurrentId,
            hasCurrentId: hasCurrentId
        };

        function hasRight(right) {
            var userdata = _getUserdata();
            return userdata && $.inArray(right, userdata.rankData.rights) > -1;
        }

        function isCurrent(id) {
            return getCurrentId() === id;
        }
        
        function hasCurrentId(array) {
            return array.indexOf(getCurrentId()) !== -1;
        }
        
        function getCurrentId() {
            var userdata = _getUserdata();
            return (userdata && userdata._id) || 0;
        }
        
        function _getUserdata() {
            return sessionStorage.userdata ? JSON.parse(sessionStorage.userdata) : 0;
        }
    }
)