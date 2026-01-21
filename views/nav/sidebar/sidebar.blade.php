
<style>
    /* Minimal CSS for custom dropdown */
.dropdown-menu {
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 1000;
    display: none; /* Default hidden */
}

</style>
<nav class="navbar bg-secondary navbar-dark">
    <a href="{{route(name: 'admin.dashboard')}}" class="navbar-brand mx-4">
        <h3 class="text-primary"><i class="fa fa-user-edit me-2"></i>Lab Box</h3>
    </a>
    <!-- <div class="d-flex align-items-center ms-4 mb-6">
        <div class="position-relative">
            <img class="rounded-circle" src="{{asset(path: 'assets/img/user.jpg')}}" alt="" style="width: 40px; height: 40px;">
            <div class="bg-success rounded-circle border border-2 border-white position-absolute end-0 bottom-0 p-1"></div>
        </div>
        <div class="ms-3">
            <h6 class="mb-0">{{ Session::get(key: 'email') }}</h6>
            <span>Admin</span>
            
        </div>
    </div> -->
    <div class="navbar-nav w-100">
        <!-- @if($ViewPermission->status == 1)<a href="{{route(name: 'admin.dashboard')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.dashboard' ? 'active' : '' }}"><i class="fa fa-tachometer-alt me-2"></i>Dashboard</a>@endif -->
        @if($ViewPermission->order_read == 1)<a href="{{route('admin.order')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.order' ? 'active' : '' }}"><i class="fa-solid fa-cube me-2"></i>Order</a>@endif 
        @if($ViewPermission->report_read == 1)<a href="{{route('admin.reports')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.reports' ? 'active' : '' }}"><i class="fa-regular fa-file-lines me-2"></i>Reports</a>@endif                  
        @if($ViewPermission->patient_read == 1)<a href="{{route('admin.patient')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.patient' ? 'active' : '' }}"><i class="fa-solid fa-bed me-2"></i>Patient</a>@endif
        @if($ViewPermission->patient_read == 1)<a href="{{route('admin.address')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.address' ? 'active' : '' }}"><i class="fa-solid fa-address-card me-2"></i>Address</a>@endif       
        @if($ViewPermission->lab_read == 1)<a href="{{route('admin.laboratory')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.laboratory' ? 'active' : '' }}"><i class="fa-solid fa-microscope me-2"></i>Laboratory</a>@endif
        @if($ViewPermission->cate_read == 1)<a href="{{route('admin.categories')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.categories' ? 'active' : '' }}"><i class="fa-solid fa-layer-group me-2"></i>Categories</a>@endif   
        @if($ViewPermission->pack_read == 1)<a href="{{route('admin.package')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.package' ? 'active' : '' }}"><i class="fa-solid fa-square-parking me-2"></i>Packages</a>@endif
        @if($ViewPermission->sub_read == 1)<a href="{{route('admin.SubPackage')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.SubPackage' ? 'active' : '' }}"><i class="fa-brands fa-stripe-s me-2"></i>Test</a>@endif          
        @if($ViewPermission->banner_read == 1)<a href="{{route('admin.banners')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.banners' ? 'active' : '' }}"><i class="fa-solid fa-tarp me-2"></i>Banners</a>@endif           
        @if($ViewPermission->offer_read == 1)<a href="{{route('admin.offers')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.offers' ? 'active' : '' }}"><i class="fa-solid fa-money-check me-2"></i>Offers</a>@endif   
        @if($ViewPermission->doctor_read == 1)<a href="{{route('admin.doctors')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.doctors' ? 'active' : '' }}"><i class="fa-solid fa-stethoscope me-2"></i>Doctor</a>@endif 
        @if($ViewPermission->is_main == 1)<a href="{{route('admin.users')}}" class="nav-item nav-link {{ Route::currentRouteName() == 'admin.users' ? 'active' : '' }}"><i class="fa-solid fa-users me-2"></i>Users</a>@endif
        
        @if($ViewPermission->status == 1)
            <li class="nav-item dropdown btn btn-sm p-0" style="position: relative;">
                <a class="nav-link d-flex align-items-center" id="customDropdown" role="button" onclick="toggleDropdown()">
                    <i class="fa-solid fa-chevron-down"></i>&nbsp;&nbsp; Setting
                </a>
                <ul class="dropdown-menu menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-red-600 menu-state-bg-light-primary fw-semibold fs-7 w-125px"
                    aria-labelledby="customDropdown" id="dropdownMenu" style="display: none; position: absolute; left: 0; top: 100%; z-index: 1000;">
                    <li class="menu-item px-3">
                        <a href="{{ route('admin.term') }}" class="dropdown-item nav-item nav-link{{ Route::currentRouteName() == 'admin.term' ? 'active' : '' }}">
                        <i class="fa-solid fa-file-contract"></i>Terms & Use
                        </a>
                    </li>
                    <li class="menu-item px-3">
                        <a href="{{ route('admin.policy') }}" class="dropdown-item nav-item nav-link{{ Route::currentRouteName() == 'admin.policy' ? 'active' : '' }}">
                        <i class="fa-solid fa-file-shield"></i>Privacy Policy
                        </a>
                    </li>
                    <li class="menu-item px-3">
                        <a href="{{ route('admin.cancellation') }}" class="dropdown-item nav-item nav-link{{ Route::currentRouteName() == 'admin.cancellation' ? 'active' : '' }}">
                        <i class="fa-solid fa-file-circle-exclamation"></i>Cancellation & <br> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Refund Policy
                        </a>
                    </li>
                </ul>
            </li>
        @endif

    </div>
    <script>
    function toggleDropdown() {
        var dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu.style.display === 'none' || dropdownMenu.style.display === '') {
            dropdownMenu.style.display = 'block';
        } else {
            dropdownMenu.style.display = 'none';
        }
    }
    
    // Optional: Click outside to close the dropdown
    document.onclick = function(event) {
        var dropdownToggle = document.getElementById('customDropdown');
        var dropdownMenu = document.getElementById('dropdownMenu');
        if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.style.display = 'none';
        }
    };
</script>

</nav>
