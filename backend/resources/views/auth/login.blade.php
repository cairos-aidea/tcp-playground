@extends('adminlte::auth.auth-page', ['auth_type' => 'login'])

@section('adminlte_css_pre')
    <link rel="stylesheet" href="{{ asset('vendor/icheck-bootstrap/icheck-bootstrap.min.css') }}">
@stop

@section('auth_header', __('adminlte::adminlte.login_message'))

@section('auth_body')
    @include('flash-message')
    @if (session()->has('exceed'))
        <span class="text-danger">{{session()->get('exceed')}}</span><br/>
        <span>Try the old login instead <a href="{{url('/login?use_form='.session()->get('login_key'))}}">HERE</a></span>
        @php session()->forget('exceed') ;@endphp
    @endif
    <form action="{{route('ms.login')}}" method="post" id="frmLogin">
        @csrf
        <div class="row justify-content-center">
            <div class="col-8">
                <button type=submit class="btn btn-block {{ config('adminlte.classes_auth_btn', 'btn-flat btn-primary') }}">
                    <span class="fab fa-microsoft"></span>
                    Login via Microsoft
                </button>
            </div>
        </div>
    </form>
@stop

@section('auth_footer')
    <div class="bg-white"><span class="d-block"></span></div>
@stop
