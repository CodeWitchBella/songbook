use leptos::*;
use web_sys::MouseEvent;

fn main() {
    leptos::mount_to_body(|| view! { <App/> })
}

#[component]
fn App() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <div class="flex flex-col gap-2 p-2">
            <label class="flex gap-2 items-baseline">
                <div class="text-xl font-semibold">"Key:"</div>
                <input type="text" class="rounded-md text-inherit bg-inherit dark:bg-stone-800" />
            </label>
            <div class="border border-solid rounded-md p-2 flex items-baseline gap-2">
                <h2 class="text-xl font-semibold">"Set to:"</h2>
                <input type="text" class="h-9 px-3 rounded-md text-inherit bg-inherit dark:bg-stone-800" />
                <Button on_click=move |_| {}>Execute</Button>
            </div>
            <div class="border border-solid rounded-md p-2 flex items-baseline gap-2">
                <h2 class="text-xl font-semibold">"Delete"</h2>
                <Button on_click=move |_| {}>Execute</Button>
            </div>
            <Button
                on_click=move |_| {
                    set_count.update(|n| *n += 1);
                }
            >
                "Click me: "
                {move || count.get()}
            </Button>
        </div>
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
