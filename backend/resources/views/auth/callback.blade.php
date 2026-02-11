@extends('adminlte::auth.auth-page', ['auth_type' => 'login'])

@section('adminlte_css_pre')
    <link rel="stylesheet" href="{{ asset('vendor/icheck-bootstrap/icheck-bootstrap.min.css') }}">
@stop

@section('auth_header', __('adminlte::adminlte.login_message'))

@section('auth_body')
    @include('flash-message')
    <form action="{{route('ms.validate')}}" method="post" id="frmValidate">
        @csrf
        <div class="row justify-content-center">
            <div class="col-12">           
                <div class="invalid-feedback font-weight-bolder">
                    <strong>There was an issue during login. Please try again later or contact your IT administrator</strong>
                </div>
            </div>
        </div>
    </form>
@stop

@section('auth_footer')
    <div class="bg-white"><span class="d-block"></span></div>
@stop

@section('js')
<script type="text/javascript">

    $(document).ready ( async () => {

        $('div.invalid-feedback').hide();
        $('div#validateIndicator').show();

        let params = window.location.hash.replace('#', '').split('&');
        let data = {};

        for (let i in params) {
            let row = params[i].split('=');
            data[row[0]] = row[1];
        }

        let form = new FormData(document.getElementById('frmValidate'));
        for ( let n in data ) {
            form.append(n, data[n]);
        }

        form.append('request_from', 'rdp');

        let response = await fetch('/ms/login/validate', {
            method: 'POST',
            body: form
        });

        let result = await response.json();

        if (response.status != 200) {
            console.log(result);
            $('div.invalid-feedback').html(result.message).show();
            $('div#validateIndicator').hide();
        } else {
            window.location.href = '/home';
        }
    });

</script>

@stop
