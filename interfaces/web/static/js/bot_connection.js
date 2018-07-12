// utility variables
var config_key_attr = "config-key";
var config_value_attr = "config-value";
var update_url_attr = "update-url";
var config_element_class = "config-element";

// utility functions
function log(text){
    window.console&&console.log(text);
}

function get_update(){
    $.ajax({
      url: "/update",
    }).done(function(data) {
        unlock_ui();

    }).fail(function(data) {
        lock_ui();

    }).always(function(data) {
        manage_alert(data);
  });
}

function lock_ui(){
    $(".nav-link").addClass("disabled");
    update_status(false);
}

function unlock_ui(){
    $(".nav-link").removeClass("disabled");
    update_status(true);
}

function update_status(status){
    icon_status = $("#navbar-bot-status")
    icon_reboot = $("#navbar-bot-reboot")

    // if refreshed page
    if (icon_status.hasClass("fa-spinner")){
        icon_status.removeClass("fa-spinner fa-spin")
    }

    // create alert if required
    if (status && icon_status.hasClass("icon-red")){
        create_alert("success", "Connected with Octobot", "");
    }else if(!status && icon_status.hasClass("icon-green")){
        create_alert("danger", "Connection lost with Octobot", "<br>Reconnecting...");
    }

    // update central status
    if (status){
        icon_status.removeClass("fa-times-circle icon-red");
        icon_status.addClass("fa-check-circle icon-green");
    }else{
        icon_status.removeClass("fa-check-circle icon-green");
        icon_status.addClass("fa-times-circle icon-red");
    }

    // update reboot status
    if (status){
        icon_reboot.removeClass("fa-spin");
    }else{
        icon_reboot.addClass("fa-spin");
    }
}

function manage_alert(raw_data){
    data = JSON.parse(raw_data)
    $.each(data, function(i, item) {
        create_alert(data[i].Level, data[i].Title, data[i].Message);
    })
}

function handle_route_button(){
    $(".btn").click(function(){
        button = $(this)
        if (button[0].hasAttribute('route')){
            command = button.attr('route');
            origin_val = button.text();
            $.ajax({
                url: command,
                beforeSend: function() {
                    button.html("<i class='fas fa-circle-notch fa-spin'></i>");
                },
                complete: function() {
                   button.html(origin_val);
                }
            });
         }
    });
}


function handle_reset_buttons(){
    $("#reset-evaluator-config").click(function() {
        reset_configuration_element($(this));
    })
}

function handle_configuration_editor(){
    $(".config-element").click(function(){
        var element = $(this);
        if (element.hasClass(config_element_class)){
            var full_config_root = element.parents(".config-root");
            if (full_config_root[0].hasAttribute(update_url_attr)){

                // build data update
                var config_elements = full_config_root.find("."+config_element_class);
                var updated_config = {};
                new_value = element.attr(config_value_attr);
                var current_value = element.attr(config_value_attr).toLowerCase();
                if (current_value == "true" || current_value == "false"){
                    // boolean
                    if (new_value.toLowerCase() == "true"){
                        new_value = "false"
                    }else{
                        new_value = "true"
                    }
                }

                updated_config[element.attr(config_key_attr)]=new_value;
                var update_url = full_config_root.attr(update_url_attr);

                // send update
                send_and_interpret_bot_update(updated_config, update_url, full_config_root);

            }
        }
    });
}

function reset_configuration_element(element){
    var full_config_root = element.parents(".config-root");
    if (full_config_root[0].hasAttribute(update_url_attr)){
        var update_url = full_config_root.attr(update_url_attr);
        // send update
        send_and_interpret_bot_update("reset", update_url, full_config_root);
    }
}

function send_and_interpret_bot_update(updated_data, update_url, dom_root_element){
    $.ajax({
        url: update_url,
        type: "POST",
        dataType: "json",
        contentType: 'application/json',
        data: JSON.stringify(updated_data),
        success: function(msg, status){
            update_dom(dom_root_element, msg);
        },
        error: function(result, status, error){
            window.console&&console.error(result);
            window.console&&console.error(status);
            window.console&&console.error(error);
            create_alert("danger", "Error when updating value.", error);
        },
    })
}

function create_alert(a_level, a_title, a_msg, url="_blank"){
    $.notify({
        title: a_title,
        message: a_msg
    },{
        element: "body",
	    position: null,
        type: a_level,
        allow_dismiss: true,
	    newest_on_top: true,
	    placement: {
            from: "top",
            align: "right"
	    },
	    showProgressbar: false,
	    offset: 20,
        spacing: 10,
        z_index: 1031,
        url_target: url,
	    delay: 5000,
	    timer: 1000,
	    animate: {
            enter: "animated fadeInDown",
            exit: "animated fadeOutUp"
	    }
    });
}

$(document).ready(function () {
    handle_reset_buttons();
    handle_configuration_editor();
    handle_route_button();
    setInterval(function(){ get_update(); }, 500);
});