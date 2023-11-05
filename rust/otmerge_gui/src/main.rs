use leptos::*;
use web_sys::MouseEvent;

fn main() {
    leptos::mount_to_body(|| view! { <App/> })
}

#[component]
fn App() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <>
            <Button
                on_click=move |_| {
                    set_count.update(|n| *n += 1);
                }
            >
                "Click me: "
                {move || count.get()}
            </Button>
        </>
    }
}

#[component]
fn Button<F>(on_click: F, children: Children) -> impl IntoView
where
    F: Fn(MouseEvent) + 'static,
{
    view! {
        <button
            class="h-9 rounded-md px-3 bg-stone-900 text-stone-50 hover:bg-stone-900/90 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-50/90"
            on:click=on_click
        >
            {children()}
        </button>
    }
}
